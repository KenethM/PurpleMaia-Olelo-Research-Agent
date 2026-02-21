const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const articleUrl = process.argv[2];
  const saveRaw = process.argv[3] !== '--no-save'; // Save by default, use --no-save to skip

  if (!articleUrl) {
    console.log('Usage: node view-article.js <article-url> [--no-save]');
    console.log('Example: node view-article.js "https://www.papakilodatabase.com/pdnupepa/?a=d&d=KNK19030327-01.2.34"');
    console.log('\nBy default, saves raw OCR text to raw-articles/ directory for verification.');
    console.log('Use --no-save to skip saving.');
    process.exit(1);
  }

  // Extract article ID from URL (e.g., KNK19030327-01.2.34)
  const articleIdMatch = articleUrl.match(/d=([A-Z0-9\-\.]+)/);
  const articleId = articleIdMatch ? articleIdMatch[1] : 'unknown';

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();

  console.log('Loading article:', articleUrl);
  console.log('Article ID:', articleId, '\n');

  await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Click on the Text tab/section to make sure it's visible
  try {
    const textTab = await page.$('text=Text');
    if (textTab) await textTab.click();
    await page.waitForTimeout(2000);
  } catch (e) {}

  // Get all text from the page
  const allText = await page.evaluate(() => {
    return document.body.innerText;
  });

  // Filter out navigation and get the article content
  const lines = allText.split('\n').filter(line =>
    line.trim().length > 0 &&
    !line.includes('Toggle navigation') &&
    !line.includes('Skip to main') &&
    !line.includes('Hawaiian Newspapers Collection')
  );

  const articleText = lines.join('\n');

  console.log('--- Article Text ---\n');
  console.log(articleText);

  // Save raw OCR text to file for verification/audit
  if (saveRaw) {
    const rawDir = path.join(__dirname, 'raw-articles');
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${articleId}_${timestamp}.txt`;
    const filepath = path.join(rawDir, filename);

    const fileContent = `URL: ${articleUrl}
Article ID: ${articleId}
Fetched: ${new Date().toISOString()}

=== RAW OCR TEXT (DO NOT MODIFY - FOR VERIFICATION) ===

${articleText}
`;

    fs.writeFileSync(filepath, fileContent);
    console.log(`\n--- Raw text saved to: raw-articles/${filename} ---`);
  }

  await browser.close();
})();
