#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const officeparser = require('officeparser');

const DOCS_DIR = path.join(__dirname, 'ctahr-pdfs');
const DB_PATH = path.join(__dirname, 'catalog.db');
const TEXT_DIR = path.join(__dirname, 'extracted-text');

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.docx', '.pptx', '.xlsx']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif']);
const ARCHIVE_EXTENSIONS = new Set(['.zip', '.tar', '.gz', '.rar', '.7z']);

function generateId(relPath) {
  return relPath
    .replace(/\.[^.]+$/, '')            // strip extension
    .replace(/\s+/g, '-')               // spaces to hyphens
    .replace(/[()[\]{}]/g, '')          // strip parens/brackets
    .replace(/%[0-9a-fA-F]{2}/g, '-')  // URL-encoded chars to hyphens
    .replace(/[^a-zA-Z0-9_\-/]/g, '-') // other special chars to hyphens
    .replace(/-+/g, '-')                // collapse runs of hyphens
    .replace(/^-|-$/g, '')              // trim leading/trailing hyphens
    .toLowerCase();
}

function getCollection(relPath) {
  const parts = relPath.split(path.sep);
  return parts.length > 1 ? parts[0] : '(root)';
}

async function extractPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return { text: data.text, pages: data.numpages };
}

async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return { text: result.value, pages: null };
}

async function extractPptxXlsx(filePath) {
  const text = await officeparser.parseOfficeAsync(filePath);
  return { text: text || '', pages: null };
}

async function extractText(filePath, ext) {
  switch (ext) {
    case '.pdf':  return extractPdf(filePath);
    case '.docx': return extractDocx(filePath);
    case '.pptx':
    case '.xlsx': return extractPptxXlsx(filePath);
    default:      return null;
  }
}

function walkDir(dir, baseDir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip hidden dirs and __MACOSX
      if (entry.name.startsWith('.') || entry.name === '__MACOSX') continue;
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      if (entry.name.startsWith('.')) continue;
      const relPath = path.relative(baseDir, fullPath);
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

function initDb(rebuild) {
  if (rebuild && fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing catalog.db (rebuild mode)');
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      collection TEXT,
      file_type TEXT NOT NULL,
      pages INTEGER,
      size_bytes INTEGER NOT NULL,
      mtime_ms INTEGER NOT NULL,
      text_length INTEGER,
      snippet TEXT,
      indexed_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      id,
      text,
      tokenize='porter unicode61'
    );
  `);

  return db;
}

async function main() {
  const args = process.argv.slice(2);
  const rebuild = args.includes('--rebuild');

  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`Error: ${DOCS_DIR} not found. Place documents there first.`);
    process.exit(1);
  }

  if (!fs.existsSync(TEXT_DIR)) {
    fs.mkdirSync(TEXT_DIR, { recursive: true });
  }

  const db = initDb(rebuild);

  const checkExisting = db.prepare(
    'SELECT id, size_bytes, mtime_ms FROM documents WHERE path = ?'
  );
  const insertDoc = db.prepare(`
    INSERT OR REPLACE INTO documents
      (id, filename, path, collection, file_type, pages, size_bytes, mtime_ms, text_length, snippet, indexed_at)
    VALUES
      (@id, @filename, @path, @collection, @file_type, @pages, @size_bytes, @mtime_ms, @text_length, @snippet, @indexed_at)
  `);
  const insertFts = db.prepare(`
    INSERT INTO documents_fts (id, text) VALUES (?, ?)
  `);
  const deleteFts = db.prepare(`
    DELETE FROM documents_fts WHERE id = ?
  `);

  console.log(`Scanning ${DOCS_DIR}...`);
  const files = walkDir(DOCS_DIR, DOCS_DIR);
  console.log(`Found ${files.length} files`);

  let indexed = 0, skipped = 0, warned = 0, errors = 0;

  for (const { fullPath, relPath } of files) {
    const ext = path.extname(relPath).toLowerCase();
    const stat = fs.statSync(fullPath);
    const id = generateId(relPath);
    const collection = getCollection(relPath);
    const filename = path.basename(relPath);

    // Check if image or archive
    if (IMAGE_EXTENSIONS.has(ext)) {
      console.log(`  [image] ${relPath} — no text extracted (use Read tool for visual review)`);
      // Still index it as metadata-only
      const existing = checkExisting.get(relPath);
      if (existing && existing.size_bytes === stat.size && existing.mtime_ms === Math.floor(stat.mtimeMs)) {
        skipped++;
        continue;
      }
      insertDoc.run({
        id, filename, path: relPath, collection, file_type: ext.slice(1),
        pages: null, size_bytes: stat.size, mtime_ms: Math.floor(stat.mtimeMs),
        text_length: 0, snippet: '(image file — no text extracted)',
        indexed_at: new Date().toISOString()
      });
      warned++;
      continue;
    }

    if (ARCHIVE_EXTENSIONS.has(ext)) {
      console.log(`  [archive] ${relPath} — skipped (unzip manually if needed)`);
      warned++;
      continue;
    }

    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      console.log(`  [skip] ${relPath} — unsupported format (${ext})`);
      warned++;
      continue;
    }

    // Check if already indexed and unchanged
    const existing = checkExisting.get(relPath);
    if (existing && existing.size_bytes === stat.size && existing.mtime_ms === Math.floor(stat.mtimeMs)) {
      skipped++;
      continue;
    }

    // Extract text
    try {
      process.stdout.write(`  Indexing ${relPath}...`);
      const result = await extractText(fullPath, ext);
      if (!result) {
        console.log(' [no extractor]');
        warned++;
        continue;
      }

      const text = result.text || '';
      const snippet = text.slice(0, 500).replace(/\s+/g, ' ').trim();
      const textLength = text.length;

      if (textLength < 50 && ext === '.pdf') {
        console.log(` [warning: very little text (${textLength} chars) — may be image-only PDF]`);
      } else {
        console.log(` OK (${textLength} chars${result.pages ? `, ${result.pages} pages` : ''})`);
      }

      // Save extracted text
      const textFilename = `${id.replace(/\//g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
      const textPath = path.join(TEXT_DIR, textFilename);
      fs.writeFileSync(textPath, text);

      // If replacing, delete old FTS entry
      if (existing) {
        deleteFts.run(id);
      }

      insertDoc.run({
        id, filename, path: relPath, collection, file_type: ext.slice(1),
        pages: result.pages, size_bytes: stat.size, mtime_ms: Math.floor(stat.mtimeMs),
        text_length: textLength, snippet,
        indexed_at: new Date().toISOString()
      });

      insertFts.run(id, text);
      indexed++;

    } catch (err) {
      console.log(` [ERROR: ${err.message}]`);
      errors++;
    }
  }

  db.close();

  console.log(`\nDone.`);
  console.log(`  Indexed: ${indexed}`);
  console.log(`  Skipped (unchanged): ${skipped}`);
  console.log(`  Warnings/skipped types: ${warned}`);
  console.log(`  Errors: ${errors}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
