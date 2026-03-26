#!/usr/bin/env node

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'catalog.db');

function openDb() {
  try {
    return new Database(DB_PATH, { readonly: true });
  } catch (err) {
    console.error(`Error: Cannot open ${DB_PATH}. Run 'node index-docs.js' first.`);
    process.exit(1);
  }
}

function showStats(db) {
  const totalDocs = db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
  const byCollection = db.prepare(
    'SELECT collection, COUNT(*) as count FROM documents GROUP BY collection ORDER BY count DESC'
  ).all();
  const byType = db.prepare(
    'SELECT file_type, COUNT(*) as count FROM documents GROUP BY file_type ORDER BY count DESC'
  ).all();
  const latestIndex = db.prepare(
    'SELECT MAX(indexed_at) as latest FROM documents'
  ).get().latest;

  console.log(`\n=== Catalog Stats ===\n`);
  console.log(`Total documents: ${totalDocs}`);
  console.log(`Last indexed: ${latestIndex || 'never'}\n`);

  console.log('Documents by collection:');
  for (const row of byCollection) {
    console.log(`  ${row.collection}: ${row.count}`);
  }

  console.log('\nDocuments by file type:');
  for (const row of byType) {
    console.log(`  .${row.file_type}: ${row.count}`);
  }
  console.log('');
}

function search(db, query, limit, typeFilter) {
  // Build the FTS query — wrap each term for prefix matching
  const ftsQuery = query
    .split(/\s+/)
    .filter(t => t.length > 0)
    .map(t => `"${t.replace(/"/g, '""')}"`)
    .join(' ');

  let sql = `
    SELECT
      d.id,
      d.filename,
      d.path,
      d.collection,
      d.file_type,
      d.pages,
      d.snippet,
      d.text_length,
      rank
    FROM documents_fts f
    JOIN documents d ON d.id = f.id
    WHERE documents_fts MATCH ?
  `;
  const params = [ftsQuery];

  if (typeFilter) {
    sql += ` AND d.file_type = ?`;
    params.push(typeFilter.replace(/^\./, ''));
  }

  sql += ` ORDER BY rank LIMIT ?`;
  params.push(limit);

  const results = db.prepare(sql).all(...params);

  if (results.length === 0) {
    console.log(`\nNo results for: ${query}`);
    return;
  }

  console.log(`\n=== Results for "${query}" (${results.length} shown) ===\n`);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const pages = r.pages ? `, ${r.pages} pages` : '';
    console.log(`${i + 1}. [${r.collection}] ${r.filename}`);
    console.log(`   ID: ${r.id}`);
    console.log(`   Path: ctahr-pdfs/${r.path}`);
    console.log(`   Type: .${r.file_type}${pages}, ${r.text_length} chars`);
    console.log(`   Snippet: ${(r.snippet || '').slice(0, 200)}...`);
    console.log('');
  }
}

function main() {
  const args = process.argv.slice(2);

  // Parse flags
  let limit = 20;
  let typeFilter = null;
  let statsMode = false;
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--stats') {
      statsMode = true;
    } else if (args[i] === '--limit' && i + 1 < args.length) {
      limit = parseInt(args[++i], 10);
    } else if (args[i] === '--type' && i + 1 < args.length) {
      typeFilter = args[++i];
    } else if (!args[i].startsWith('--')) {
      positional.push(args[i]);
    }
  }

  const db = openDb();

  if (statsMode) {
    showStats(db);
    db.close();
    return;
  }

  if (positional.length === 0) {
    console.log('Usage:');
    console.log('  node search-docs.js "search query"');
    console.log('  node search-docs.js "query" --limit 10');
    console.log('  node search-docs.js "query" --type pdf');
    console.log('  node search-docs.js --stats');
    db.close();
    process.exit(1);
  }

  const query = positional.join(' ');
  search(db, query, limit, typeFilter);
  db.close();
}

main();
