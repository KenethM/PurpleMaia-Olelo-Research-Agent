import { chromium } from 'playwright';
import type { Source } from '@/types/research';

/**
 * Returns playwright launch options that work both locally (macOS/Windows with
 * system Chrome) and on Linux servers (Dokku/Heroku) where Chromium is installed
 * at a known path.  Set CHROMIUM_EXECUTABLE_PATH to override the auto-detection.
 */
function getLaunchOptions() {
  const isLinux = process.platform === 'linux';
  const args = isLinux
    ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ]
    : [];

  // Allow explicit override (only if the file actually exists)
  const override = process.env.CHROMIUM_EXECUTABLE_PATH;
  if (override) {
    const { existsSync } = require('fs') as typeof import('fs');
    if (existsSync(override)) return { headless: true as const, executablePath: override, args };
  }

  // On Linux, check common system paths; otherwise let playwright use its own downloaded browser
  if (isLinux) {
    const { existsSync } = require('fs') as typeof import('fs');
    const candidates = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
    ];
    for (const p of candidates) {
      if (existsSync(p)) return { headless: true as const, executablePath: p, args };
    }
    // Fall back to playwright's bundled browser (downloaded by postinstall)
    return { headless: true as const, args };
  }

  // macOS/Windows: use system Chrome
  return { headless: true as const, channel: 'chrome' as const, args };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PapakiloArticle {
  url: string;
  title: string;
  meta: string;
  resultIndex: number;
}

export interface PapakiloSearchResult {
  term: string;
  totalResults: number;
  articles: PapakiloArticle[];
}

export interface PapakiloArticleContent {
  url: string;
  title: string;
  rawText: string;
  articleId: string;
}

export interface PapakiloOptions {
  maxTerms?: number;
  maxArticlesPerTerm?: number;
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// T006: searchPapakilo — search the Papakilo newspaper collection
// ---------------------------------------------------------------------------

export async function searchPapakilo(term: string, signal?: AbortSignal): Promise<PapakiloSearchResult> {
  if (signal?.aborted) throw new Error('Aborted');
  const browser = await chromium.launch(getLaunchOptions());
  try {
    const page = await browser.newPage();
    const searchUrl =
      'https://www.papakilodatabase.com/pdnupepa/cgi-bin/pdnupepa?a=p&p=home';

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.fill('#homepagesearchinputtxq', term);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    // Extract total result count
    const totalResults = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/Results?\s+\d+\s+to\s+\d+\s+of\s+([\d,]+)/i);
      return match ? parseInt(match[1].replace(/,/g, '')) : 0;
    });

    // Extract article links from the results page
    const rawArticles = await page.evaluate(() => {
      const results: { url: string; title: string; meta: string }[] = [];
      const links = document.querySelectorAll('a[href*="a=d&d="]');
      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        const text = link.textContent?.trim() ?? '';
        const parent = link.closest('li') ?? link.parentElement;
        const fullText = parent?.textContent?.trim() ?? text;
        if (href && text && !results.find((r) => r.url === href)) {
          results.push({
            url: href,
            title: text.substring(0, 100),
            meta: fullText.substring(0, 200),
          });
        }
      });
      return results;
    });

    return {
      term,
      totalResults,
      articles: rawArticles.map((a, i) => ({ ...a, resultIndex: i + 1 })),
    };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// T007: fetchArticleContent — extract OCR text from a single article
// ---------------------------------------------------------------------------

export async function fetchArticleContent(url: string, signal?: AbortSignal): Promise<PapakiloArticleContent> {
  if (signal?.aborted) throw new Error('Aborted');
  const articleIdMatch = url.match(/d=([A-Z0-9\-.]+)/i);
  const articleId = articleIdMatch ? articleIdMatch[1] : 'unknown';

  const browser = await chromium.launch(getLaunchOptions());
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // Try clicking the Text tab to reveal OCR content
    try {
      const textTab = await page.$('text=Text');
      if (textTab) {
        await textTab.click();
        await page.waitForTimeout(2000);
      }
    } catch {
      // Tab may not exist — proceed with page text
    }

    const title = await page.title();

    const rawText = await page.evaluate(() => {
      const lines = document.body.innerText
        .split('\n')
        .filter(
          (line) =>
            line.trim().length > 0 &&
            !line.includes('Toggle navigation') &&
            !line.includes('Skip to main') &&
            !line.includes('Hawaiian Newspapers Collection')
        );
      return lines.join('\n');
    });

    return { url, title, rawText, articleId };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// T008: researchWithPapakilo — top-level orchestrator; never throws
// ---------------------------------------------------------------------------

export async function researchWithPapakilo(
  searchTerms: string[],
  options: PapakiloOptions = {},
  signal?: AbortSignal
): Promise<{ articles: PapakiloArticleContent[]; sources: Source[]; totalFound: number }> {
  const maxTerms = options.maxTerms ?? 3;
  const maxArticlesPerTerm = options.maxArticlesPerTerm ?? 3;

  console.log('[papakilo] Starting search with terms:', searchTerms.slice(0, maxTerms));
  console.log('[papakilo] Launch options:', JSON.stringify(getLaunchOptions()));

  const collectedArticles: PapakiloArticleContent[] = [];
  let totalFound = 0;

  const termsToSearch = searchTerms.slice(0, maxTerms);

  for (let i = 0; i < termsToSearch.length; i++) {
    if (signal?.aborted) break;
    const term = termsToSearch[i];
    try {
      const searchResult = await searchPapakilo(term, signal);
      totalFound += searchResult.totalResults;

      const topArticles = searchResult.articles.slice(0, maxArticlesPerTerm);

      for (const article of topArticles) {
        if (signal?.aborted) break;
        try {
          const content = await fetchArticleContent(article.url, signal);
          collectedArticles.push(content);
        } catch (err) {
          if (signal?.aborted) break;
          console.warn('[papakilo] Failed to fetch article:', article.url, err);
        }

        // Respectful delay between article fetches
        await sleep(1000);
      }
    } catch (err) {
      if (signal?.aborted) break;
      console.warn('[papakilo] Failed to search term:', term, err);
    }

    // Delay between search terms
    if (i < termsToSearch.length - 1) {
      await sleep(1500);
    }
  }

  // Deduplicate by articleId
  const seen = new Set<string>();
  const unique = collectedArticles.filter((a) => {
    if (seen.has(a.articleId)) return false;
    seen.add(a.articleId);
    return true;
  });

  // Map to Source[] for use in ResearchResult
  const sources: Source[] = unique.map((a, i) => ({
    id: `papakilo_${i}`,
    title: a.title || a.articleId,
    url: a.url,
    type: 'papakilo-live' as const,
    excerpt: a.rawText.slice(0, 200),
  }));

  return { articles: unique, sources, totalFound };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
