const { chromium } = require('playwright-core');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const articleUrl = process.argv[2];
  const useSystemBrowser = process.argv.includes('--system');

  if (!articleUrl) {
    console.log('Usage: node download-pdf.js <article-url> [--system]');
    console.log('Example: node download-pdf.js "https://www.papakilodatabase.com/pdnupepa/?a=d&d=KNK19030327-01.2.34"');
    console.log('\nDownloads the original newspaper issue PDF for verification.');
    console.log('PDFs are saved to source-pdfs/ directory.');
    console.log('\nOptions:');
    console.log('  --system  Open in system browser instead of Playwright (recommended)');
    process.exit(1);
  }

  // Extract article ID from URL
  const articleIdMatch = articleUrl.match(/d=([A-Z0-9\-\.]+)/);
  if (!articleIdMatch) {
    console.error('Could not extract article ID from URL');
    process.exit(1);
  }

  const articleId = articleIdMatch[1];
  const issueId = articleId.replace(/\.\d+\.\d+$/, '');

  console.log('Article ID:', articleId);
  console.log('Issue ID:', issueId);

  // Create output directory
  const pdfDir = path.join(__dirname, 'source-pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir);
  }

  const pdfFilename = `${issueId}.pdf`;
  const pdfPath = path.join(pdfDir, pdfFilename);

  // Check if we already have this PDF
  if (fs.existsSync(pdfPath)) {
    console.log(`\nPDF already exists: source-pdfs/${pdfFilename}`);
    console.log('Skipping. Delete the file to re-download.');
    process.exit(0);
  }

  // Get PDF download page URL
  console.log('\nFinding PDF download link...');

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();

  await page.goto(articleUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const pdfLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const pdfAnchor = links.find(a => a.textContent.includes('Issue PDF'));
    return pdfAnchor ? pdfAnchor.href : null;
  });

  await browser.close();

  if (!pdfLink) {
    console.error('Could not find PDF link on page');
    process.exit(1);
  }

  console.log('PDF download page:', pdfLink);

  // Watch Downloads folder for new PDFs
  const downloadDir = path.join(os.homedir(), 'Downloads');
  const existingFiles = new Set(
    fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'))
  );

  // Open in system browser
  console.log('\n========================================');
  console.log('Opening in your default browser...');
  console.log('========================================');
  console.log('');
  console.log('1. Solve CAPTCHA if prompted');
  console.log('2. Once PDF displays, press Cmd+S to save');
  console.log('3. Save to your Downloads folder');
  console.log('');
  console.log(`Target: ${pdfFilename}`);
  console.log('========================================\n');

  // Open URL in system default browser
  const openCmd = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';

  exec(`${openCmd} "${pdfLink}"`, (err) => {
    if (err) console.error('Error opening browser:', err.message);
  });

  // Watch for downloaded PDF
  console.log('Watching ~/Downloads for new PDF (3 minutes)...');
  console.log('Press Ctrl+C when done.\n');

  let found = false;
  const startTime = Date.now();
  const timeout = 180000; // 3 minutes

  while (!found && (Date.now() - startTime) < timeout) {
    await new Promise(r => setTimeout(r, 2000));

    // Check for new PDFs
    const currentFiles = fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'));
    for (const file of currentFiles) {
      if (!existingFiles.has(file)) {
        const filePath = path.join(downloadDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.size > 100000) { // At least 100KB
            // Copy to our directory
            fs.copyFileSync(filePath, pdfPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            console.log(`\nFound: ${file}`);
            console.log(`Copied to: source-pdfs/${pdfFilename} (${sizeMB} MB)`);
            found = true;
            break;
          }
        } catch (e) {
          // File might still be downloading
        }
      }
    }

    // Also check if saved directly to source-pdfs
    if (!found && fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      if (stats.size > 100000) {
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`\nPDF saved: source-pdfs/${pdfFilename} (${sizeMB} MB)`);
        found = true;
      }
    }
  }

  if (!found) {
    console.log('\nNo PDF detected in Downloads folder.');
    console.log('If you saved elsewhere, please move it to:');
    console.log(`  ${pdfPath}`);
  }

  console.log('\nDone.');
})();
