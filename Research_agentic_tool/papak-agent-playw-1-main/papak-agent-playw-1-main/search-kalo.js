const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();

  const searchTerm = process.argv[2] || 'na inoa o na kalo';

  const newspaperUrl = 'https://www.papakilodatabase.com/pdnupepa/cgi-bin/pdnupepa?a=p&p=home';
  console.log(`Searching newspapers for: "${searchTerm}"`);

  await page.goto(newspaperUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  await page.fill('#homepagesearchinputtxq', searchTerm);
  await page.keyboard.press('Enter');

  console.log('Waiting for results...');
  await page.waitForTimeout(5000);

  // Extract article links - look for links containing article IDs
  const articles = await page.evaluate(() => {
    const results = [];
    const links = document.querySelectorAll('a[href*="a=d&d="]');
    links.forEach(link => {
      const href = link.href;
      const text = link.textContent?.trim() || '';
      // Get parent container text for context
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

  console.log(`\nFound ${articles.length} articles:\n`);
  articles.forEach((a, i) => {
    console.log(`${i+1}. ${a.title}`);
    console.log(`   ${a.meta}`);
    console.log(`   ${a.url}\n`);
  });

  await browser.close();
})();
