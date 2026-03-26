#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const officeparser = require('officeparser');

const DB_PATH = path.join(__dirname, 'catalog.db');
const TEXT_DIR = path.join(__dirname, 'extracted-text');
const DOCS_DIR = path.join(__dirname, 'ctahr-pdfs');

function resolvePathFromId(id) {
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare('SELECT path FROM documents WHERE id = ?').get(id);
    db.close();
    if (row) return path.join(DOCS_DIR, row.path);
  } catch (err) {
    // DB doesn't exist, fall through to direct path
  }
  return null;
}

function generateId(relPath) {
  return relPath
    .replace(/\.[^.]+$/, '')
    .replace(/\s+/g, '-')
    .replace(/[()[\]{}]/g, '')
    .replace(/%[0-9a-fA-F]{2}/g, '-')
    .replace(/[^a-zA-Z0-9_\-/]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function extractAndPrint(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';
  let pages = null;

  switch (ext) {
    case '.pdf': {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data.text;
      pages = data.numpages;
      break;
    }
    case '.docx': {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
      break;
    }
    case '.pptx':
    case '.xlsx': {
      text = await officeparser.parseOfficeAsync(filePath) || '';
      break;
    }
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.bmp':
    case '.tiff':
    case '.tif': {
      console.log(`Image file: ${filePath}`);
      console.log('Use the Read tool to view this file directly (multimodal rendering).');
      return;
    }
    default: {
      console.error(`Unsupported format: ${ext}`);
      console.log('Supported: .pdf, .docx, .pptx, .xlsx');
      process.exit(1);
    }
  }

  // Print header
  console.log(`\n${'='.repeat(60)}`);
  console.log(`File: ${path.basename(filePath)}`);
  console.log(`Path: ${filePath}`);
  if (pages) console.log(`Pages: ${pages}`);
  console.log(`Text length: ${text.length} chars`);
  console.log(`${'='.repeat(60)}\n`);

  // Print text with page markers for PDFs
  console.log(text);

  return { text, pages };
}

async function main() {
  const args = process.argv.slice(2);
  const noSave = args.includes('--no-save');
  const positional = args.filter(a => a !== '--no-save');

  if (positional.length === 0) {
    console.log('Usage:');
    console.log('  node view-doc.js "ctahr-pdfs/SMARTS2/file.pdf"   # by path');
    console.log('  node view-doc.js smarts2/file                     # by catalog ID');
    console.log('  node view-doc.js smarts2/file --no-save');
    process.exit(1);
  }

  const input = positional.join(' ');
  let filePath = null;
  let id = null;

  // Try as direct path first
  if (fs.existsSync(input)) {
    filePath = input;
    const relPath = path.relative(DOCS_DIR, filePath);
    id = generateId(relPath);
  } else if (fs.existsSync(path.join(DOCS_DIR, input))) {
    filePath = path.join(DOCS_DIR, input);
    id = generateId(input);
  } else {
    // Try as catalog ID
    filePath = resolvePathFromId(input);
    id = input;
    if (!filePath) {
      console.error(`Cannot find document: ${input}`);
      console.error('Provide a valid file path or catalog ID.');
      process.exit(1);
    }
  }

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const result = await extractAndPrint(filePath);
  if (!result) return; // image file, nothing to save

  // Save extracted text
  if (!noSave) {
    if (!fs.existsSync(TEXT_DIR)) {
      fs.mkdirSync(TEXT_DIR, { recursive: true });
    }
    const safeId = id.replace(/\//g, '_');
    const date = new Date().toISOString().slice(0, 10);
    const textFilename = `${safeId}_${date}.txt`;
    const textPath = path.join(TEXT_DIR, textFilename);
    fs.writeFileSync(textPath, result.text);
    console.log(`\nSaved to: ${textPath}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
