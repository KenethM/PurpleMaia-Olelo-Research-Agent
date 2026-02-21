const { chromium } = require('playwright-core');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome' // Use installed Chrome
  });

  const page = await browser.newPage();

  console.log('Navigating to papakilodatabase.com...');
  await page.goto('https://papakilodatabase.com', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('Taking screenshot...');
  await page.screenshot({
    path: 'homepage-screenshot.png',
    fullPage: false
  });

  console.log('Screenshot saved to homepage-screenshot.png');

  // Get page title and some basic info
  const title = await page.title();
  console.log('Page title:', title);

  await browser.close();
  console.log('Done!');
})();
