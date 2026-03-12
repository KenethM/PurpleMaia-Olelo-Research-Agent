import { chromium } from 'playwright';
import type { Source } from '@/types/research';

const PAPAKILO_BASE = 'https://www.papakilodatabase.com/pdnupepa/cgi-bin/pdnupepa';
const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Returns playwright launch options that work both locally (macOS/Windows with
 * system Chrome) and on Linux servers (Dokku/Heroku) where Chromium is installed
 * at a known path.  Set CHROMIUM_EXECUTABLE_PATH to override the auto-detection.
 */
function getLaunchOptions() {
  const isLinux = process.platform === 'linux';
  // NOTE: --single-process is intentionally excluded — it causes Chromium crashes
  // on some Linux kernels and can cause page.fill() to hang indefinitely.
  const args = isLinux
    ? [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
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
// HTTP helpers — Greenstone returns server-rendered HTML, no JS required
// ---------------------------------------------------------------------------

/** Strip HTML tags and decode common entities, returning plain text. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}

/** Parse article links and result count from Greenstone search-results HTML. */
function parseSearchHtml(html: string, baseUrl: string): { totalResults: number; articles: Omit<PapakiloArticle, 'resultIndex'>[] } {
  // Total results count
  const countMatch = html.match(/Results?\s+\d+\s+to\s+\d+\s+of\s+([\d,]+)/i);
  const totalResults = countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : 0;

  // Article links — href contains "a=d&d="
  const articles: Omit<PapakiloArticle, 'resultIndex'>[] = [];
  const seen = new Set<string>();
  // Match href and link text; Greenstone wraps these in <a href="...">Title</a>
  const linkRegex = /href="([^"]*a=d&d=[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();
    if (!href || !rawTitle || rawTitle.length < 2) continue;
    if (!href.startsWith('http')) href = baseUrl + href;
    if (seen.has(href)) continue;
    seen.add(href);
    articles.push({
      url: href,
      title: rawTitle.substring(0, 120),
      meta: '',
    });
  }

  return { totalResults, articles };
}

/**
 * Search Papakilo via HTTP fetch (no browser).
 * Greenstone CGI returns static HTML — much faster and more reliable than Playwright.
 * Tries multiple known Greenstone search URL patterns in order.
 */
async function searchPapakiloHttp(
  term: string,
  signal?: AbortSignal
): Promise<{ totalResults: number; articles: Omit<PapakiloArticle, 'resultIndex'>[] }> {
  const q = encodeURIComponent(term);
  const base = 'https://www.papakilodatabase.com';
  // Try multiple Greenstone query URL patterns — different installations use different params
  const urlsToTry = [
    `${PAPAKILO_BASE}?a=q&q=${q}&t=0&l=en&w=text`,
    `${PAPAKILO_BASE}?a=q&q=${q}&t=0&l=en`,
    `${PAPAKILO_BASE}?a=q&q=${q}&t=0`,
    `${PAPAKILO_BASE}?a=q&q=${q}`,
  ];

  for (const url of urlsToTry) {
    if (signal?.aborted) throw new Error('Aborted');
    try {
      const resp = await fetch(url, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) {
        console.warn(`[papakilo] HTTP ${resp.status} for URL: ${url}`);
        continue;
      }
      const html = await resp.text();
      const { totalResults, articles } = parseSearchHtml(html, base);

      // If the page redirected to home (no results, no article links), try next pattern
      if (totalResults === 0 && articles.length === 0) {
        console.log(`[papakilo] No results from URL pattern: ${url}`);
        continue;
      }

      console.log(`[papakilo] HTTP search succeeded: ${totalResults} results, ${articles.length} links via ${url}`);
      return { totalResults, articles };
    } catch (err) {
      if (signal?.aborted) throw new Error('Aborted');
      console.warn(`[papakilo] HTTP fetch failed for ${url}:`, err);
    }
  }

  throw new Error(`HTTP search exhausted all URL patterns for term: "${term}"`);
}

/**
 * Fetch article OCR text via HTTP fetch (no browser).
 * Tries the plain text variant URL first, then the main article page.
 */
async function fetchArticleContentHttp(
  url: string,
  articleId: string,
  signal?: AbortSignal
): Promise<{ title: string; rawText: string }> {
  if (signal?.aborted) throw new Error('Aborted');

  // Greenstone sometimes exposes a text-only view via &dt=text or similar
  const urlsToTry = [
    url.includes('?') ? `${url}&dt=text` : `${url}?dt=text`,
    url,
  ];

  for (const fetchUrl of urlsToTry) {
    if (signal?.aborted) throw new Error('Aborted');
    try {
      const resp = await fetch(fetchUrl, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : articleId;

      // Extract raw text, filtering out nav boilerplate
      const rawText = htmlToText(html)
        .split('\n')
        .filter(
          (line) =>
            line.trim().length > 0 &&
            !line.includes('Toggle navigation') &&
            !line.includes('Skip to main') &&
            !line.includes('Hawaiian Newspapers Collection')
        )
        .join('\n');

      if (rawText.length > 100) {
        return { title, rawText };
      }
    } catch (err) {
      if (signal?.aborted) throw new Error('Aborted');
      console.warn(`[papakilo] HTTP article fetch failed for ${fetchUrl}:`, err);
    }
  }

  throw new Error(`HTTP article fetch failed for articleId=${articleId}`);
}

// ---------------------------------------------------------------------------
// T006: searchPapakilo — search the Papakilo newspaper collection
// ---------------------------------------------------------------------------

export async function searchPapakilo(term: string, signal?: AbortSignal): Promise<PapakiloSearchResult> {
  if (signal?.aborted) throw new Error('Aborted');

  // Primary: HTTP fetch (fast, no browser spin-up)
  try {
    const { totalResults, articles } = await searchPapakiloHttp(term, signal);
    return {
      term,
      totalResults,
      articles: articles.map((a, i) => ({ ...a, resultIndex: i + 1 })),
    };
  } catch (err) {
    if (signal?.aborted) throw new Error('Aborted');
    console.warn(`[papakilo] HTTP search failed for "${term}", falling back to Playwright:`, err);
  }

  // Fallback: Playwright browser (slower but handles JS-rendered pages)
  const encodedTerm = encodeURIComponent(term);
  const browser = await chromium.launch(getLaunchOptions());
  try {
    const page = await browser.newPage();

    // Try direct Greenstone query URL first — avoids form interaction
    let usedDirectUrl = false;
    try {
      const directUrl = `${PAPAKILO_BASE}?a=q&q=${encodedTerm}&t=0&l=en&w=text`;
      await page.goto(directUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000);
      usedDirectUrl = await page.evaluate(() =>
        document.querySelectorAll('a[href*="a=d&d="]').length > 0 ||
        /Results?\s+\d+\s+to\s+\d+\s+of/i.test(document.body.innerText)
      );
    } catch {
      /* ignore — try form next */
    }

    if (!usedDirectUrl) {
      await page.goto(`${PAPAKILO_BASE}?a=p&p=home`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForSelector('#homepagesearchinputtxq', { timeout: 60000 });
      await page.fill('#homepagesearchinputtxq', term);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(6000);
    }

    const totalResults = await page.evaluate(() => {
      const match = document.body.innerText.match(/Results?\s+\d+\s+to\s+\d+\s+of\s+([\d,]+)/i);
      return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
    });

    const rawArticles = await page.evaluate(() => {
      const results: { url: string; title: string; meta: string }[] = [];
      document.querySelectorAll<HTMLAnchorElement>('a[href*="a=d&d="]').forEach((link) => {
        const href = link.href;
        const text = link.textContent?.trim() ?? '';
        const parent = link.closest('li') ?? link.parentElement;
        const fullText = parent?.textContent?.trim() ?? text;
        if (href && text && !results.find((r) => r.url === href)) {
          results.push({ url: href, title: text.substring(0, 100), meta: fullText.substring(0, 200) });
        }
      });
      return results;
    });

    console.log(`[papakilo] Playwright found ${totalResults} results, ${rawArticles.length} links for "${term}"`);
    return { term, totalResults, articles: rawArticles.map((a, i) => ({ ...a, resultIndex: i + 1 })) };
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

  // Primary: HTTP fetch
  try {
    const { title, rawText } = await fetchArticleContentHttp(url, articleId, signal);
    return { url, title, rawText, articleId };
  } catch (err) {
    if (signal?.aborted) throw new Error('Aborted');
    console.warn(`[papakilo] HTTP article fetch failed for ${url}, falling back to Playwright:`, err);
  }

  // Fallback: Playwright browser
  const browser = await chromium.launch(getLaunchOptions());
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);

    try {
      const textTab = await page.$('text=Text');
      if (textTab) {
        await textTab.click();
        await page.waitForTimeout(2000);
      }
    } catch { /* tab may not exist */ }

    const title = await page.title();
    const rawText = await page.evaluate(() =>
      document.body.innerText
        .split('\n')
        .filter(
          (line) =>
            line.trim().length > 0 &&
            !line.includes('Toggle navigation') &&
            !line.includes('Skip to main') &&
            !line.includes('Hawaiian Newspapers Collection')
        )
        .join('\n')
    );

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

        await sleep(500);
      }
    } catch (err) {
      if (signal?.aborted) break;
      console.warn('[papakilo] Failed to search term:', term, err);
    }

    if (i < termsToSearch.length - 1) await sleep(800);
  }

  // Deduplicate by articleId
  const seen = new Set<string>();
  const unique = collectedArticles.filter((a) => {
    if (seen.has(a.articleId)) return false;
    seen.add(a.articleId);
    return true;
  });

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
