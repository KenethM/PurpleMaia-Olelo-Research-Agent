const { chromium } = require('playwright-core');

(async () => {
  // Parse arguments: search-newspapers.js "term" [--page N]
  const args = process.argv.slice(2);
  let searchTerm = '';
  let pageNum = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--page' && args[i + 1]) {
      pageNum = parseInt(args[i + 1]);
      i++;
    } else if (!args[i].startsWith('--')) {
      searchTerm = args[i];
    }
  }

  searchTerm = searchTerm || 'kanu kalo';

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();

  // Go to newspaper search
  const newspaperUrl = 'https://www.papakilodatabase.com/pdnupepa/cgi-bin/pdnupepa?a=p&p=home';
  console.log(`Searching newspapers for: "${searchTerm}" (page ${pageNum})`);

  await page.goto(newspaperUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill in search and submit
  await page.fill('#homepagesearchinputtxq', searchTerm);
  await page.keyboard.press('Enter');

  // Wait for results
  console.log('Waiting for results...');
  await page.waitForTimeout(5000);

  // Extract result count
  const resultInfo = await page.evaluate(() => {
    const text = document.body.innerText;
    const match = text.match(/Results?\s+(\d+)\s+to\s+(\d+)\s+of\s+([\d,]+)/i);
    if (match) {
      return {
        from: parseInt(match[1]),
        to: parseInt(match[2]),
        total: parseInt(match[3].replace(/,/g, ''))
      };
    }
    return null;
  });

  if (resultInfo) {
    const totalPages = Math.ceil(resultInfo.total / 20);
    console.log(`Results: ${resultInfo.total} total (${totalPages} pages)`);

    // Navigate to requested page if > 1
    if (pageNum > 1) {
      if (pageNum > totalPages) {
        console.log(`Warning: page ${pageNum} exceeds total pages (${totalPages}), showing page 1`);
        pageNum = 1;
      } else {
        const startResult = (pageNum - 1) * 20 + 1;
        const currentUrl = page.url();
        const newUrl = currentUrl.replace(/r=\d+/, `r=${startResult}`);
        console.log(`Navigating to page ${pageNum} (results ${startResult}-${Math.min(startResult + 19, resultInfo.total)})...`);
        await page.goto(newUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);
      }
    }
  } else {
    console.log('Could not parse result count');
  }

  // Screenshot with page number in filename
  const screenshotFile = `newspapers-${searchTerm.replace(/\s+/g, '-')}${pageNum > 1 ? `-p${pageNum}` : ''}.png`;
  await page.screenshot({ path: screenshotFile, fullPage: false });
  console.log(`Screenshot saved: ${screenshotFile}`);

  // Extract article links from this page
  const articles = await page.evaluate(() => {
    const results = [];
    const links = document.querySelectorAll('a[href*="a=d&d="]');
    links.forEach(link => {
      const href = link.href;
      const text = link.textContent?.trim() || '';
      const parent = link.closest('li') || link.parentElement;
      const fullText = parent?.textContent?.trim() || text;
      if (href && text && !results.find(r => r.url === href)) {
        results.push({
          url: href,
          title: text.substring(0, 100),
          meta: fullText.substring(0, 200)
        });
      }
    });
    return results;
  });

  console.log(`\nArticles on this page: ${articles.length}\n`);
  articles.forEach((a, i) => {
    const num = (pageNum - 1) * 20 + i + 1;
    console.log(`${num}. ${a.title}`);
    console.log(`   ${a.meta}`);
    console.log(`   ${a.url}\n`);
  });

  console.log('URL:', page.url());

  await browser.close();
})();
