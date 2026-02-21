# PDF Download Implementation Notes

This document captures learnings from implementing PDF downloads from the Papakilo Database, which uses CAPTCHA protection and has specific behaviors that complicate automated downloads.

## The Challenge

The Papakilo Database protects PDF downloads with:
1. **reCAPTCHA** - Must be solved before PDF access
2. **Inline PDF viewing** - PDFs display in browser rather than triggering downloads
3. **Dynamic loading** - PDF content loads via JavaScript after CAPTCHA

## Approaches Tried

### 1. Playwright Download Events (Failed)
```javascript
const download = await page.waitForEvent('download');
await download.saveAs(pdfPath);
```
**Result:** Download events never fired because PDFs display inline rather than triggering browser downloads.

### 2. Response Interception (Partial Success)
```javascript
page.on('response', async (response) => {
  if (contentType.includes('application/pdf')) {
    pdfBuffer = await response.body();
  }
});
```
**Result:** Captured only the HTML wrapper page, not the actual PDF. The real PDF is loaded dynamically via blob URLs or embedded viewers.

### 3. CDP Download Behavior (Failed)
```javascript
const client = await context.newCDPSession(page);
await client.send('Browser.setDownloadBehavior', {
  behavior: 'allowAndName',
  downloadPath: pdfDir
});
```
**Result:** Playwright's sandboxed Chrome instance ignores these settings. Downloads triggered in the browser showed "completed" but files weren't saved to the filesystem.

### 4. Print to PDF via CDP (Wrong Output)
```javascript
const { data } = await client.send('Page.printToPDF', {
  printBackground: true,
  preferCSSPageSize: true
});
```
**Result:** Captured a print of the current browser view (1 page, 0.7 MB) instead of the original multi-page newspaper scan (4+ pages, 5-9 MB).

### 5. Chrome with `--disable-pdf-viewer` Flag (Failed)
```javascript
const browser = await chromium.launch({
  args: ['--disable-pdf-viewer']
});
```
**Result:** Chrome's built-in PDF viewer still activated, overriding the flag.

### 6. System Browser + Download Watcher (Success!)
```javascript
// Find PDF link with headless Playwright
const pdfLink = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a'));
  return links.find(a => a.textContent.includes('Issue PDF'))?.href;
});

// Open in system browser
exec(`open "${pdfLink}"`);

// Watch Downloads folder for new PDFs
while (!found) {
  const currentFiles = fs.readdirSync(downloadDir);
  // Check for new PDFs...
}
```
**Result:** Works reliably. System browser handles downloads normally, script watches for new files.

## Final Solution

The working approach separates concerns:

1. **Headless Playwright** - Used only to navigate and find the PDF download link
2. **System Browser** - Opens the actual PDF page (handles CAPTCHA, downloads work normally)
3. **File Watcher** - Monitors ~/Downloads for new PDFs, copies to project directory

### Why This Works
- System Chrome/Safari has proper download handling with real filesystem access
- User can solve CAPTCHA in their normal browser
- Downloads save to the user's actual Downloads folder
- Script detects new files and copies with standardized naming

## Playwright Download Limitations Discovered

### Sandboxed Chrome Profile
Playwright launches Chrome with a temporary profile in:
```
/var/folders/.../T/playwright_chromiumdev_profile-XXXXX/
```
This profile has broken download functionality - the browser UI shows downloads as complete, but files don't persist to the filesystem.

### Download Event Requirements
Playwright's `page.waitForEvent('download')` only fires when:
- Server sends `Content-Disposition: attachment` header
- Browser initiates an actual download (not inline viewing)

PDFs that display inline in Chrome's PDF viewer don't trigger download events.

### CDP Limitations
`Browser.setDownloadBehavior` and `Page.setDownloadBehavior` work for headless downloads but don't override Chrome's PDF viewer behavior in headed mode.

## Code Patterns

### Finding PDF Links
```javascript
const pdfLink = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a'));
  const pdfAnchor = links.find(a => a.textContent.includes('Issue PDF'));
  return pdfAnchor ? pdfAnchor.href : null;
});
```

### Opening System Browser (Cross-Platform)
```javascript
const openCmd = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
exec(`${openCmd} "${url}"`);
```

### Watching for New Files
```javascript
const existingFiles = new Set(
  fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'))
);

// In loop:
const currentFiles = fs.readdirSync(downloadDir).filter(f => f.endsWith('.pdf'));
for (const file of currentFiles) {
  if (!existingFiles.has(file)) {
    // New file detected
    const stats = fs.statSync(path.join(downloadDir, file));
    if (stats.size > 100000) { // At least 100KB (real PDF)
      // Process new file
    }
  }
}
```

## File Naming Convention

Article URLs follow the pattern:
```
https://www.papakilodatabase.com/pdnupepa/?a=d&d=NEWSPAPER_CODE+DATE-ISSUE.SECTION.ARTICLE
```

Example: `KNK19030327-01.2.34`
- `KNK` = Ka Nupepa Kuokoa
- `19030327` = March 27, 1903
- `01` = Issue 01
- `2.34` = Section 2, Article 34

PDFs are saved as `NEWSPAPER_CODE+DATE-ISSUE.pdf` (dropping the section/article since PDFs are full issues):
- `KNK19030327-01.pdf`
- `KHHA19220105-01.pdf`

## CAPTCHA Behavior Notes

- CAPTCHA appears on first visit but may be cached for subsequent visits
- Solving CAPTCHA in system browser persists for that browser session
- No way to bypass CAPTCHA programmatically (by design)

## Recommendations for Similar Projects

1. **Don't fight Playwright's download limitations** - Use system browser for user-interactive downloads
2. **Headless for navigation, headed for interaction** - Combine approaches
3. **File watching is reliable** - Monitor download folders rather than trying to intercept
4. **Accept semi-manual workflows** - When CAPTCHA is involved, user interaction is required anyway
5. **Standardize file naming** - Rename downloaded files to consistent naming scheme

## Related Files

- `download-pdf.js` - Main download script
- `source-pdfs/` - Directory for downloaded PDFs
- `raw-articles/` - OCR text (automated, no CAPTCHA)
