# Repository Guidelines

**IMPORTANT: Keep this file in sync with `CLAUDE.md`.** Both files describe the same project rules and workflow. When updating one, update the other. `CLAUDE.md` is the detailed reference; this file is the condensed version for quick orientation. If they conflict, `CLAUDE.md` is authoritative.

## Purpose & Structure
- Goal: enable natural-language research of a local CTAHR (UH College of Tropical Agriculture) document collection using indexed full-text search.
- Core scripts at repo root: `index-docs.js` (build/update SQLite FTS5 index from `ctahr-pdfs/`), `search-docs.js` (query the index with BM25 ranking), `view-doc.js` (extract + display text from a single document, save to `extracted-text/`).
- For visual content (charts, tables, images, slide decks), use the Read tool directly on the file.
- Research artifacts: results in `results/`, briefs in `research-briefs/`, state in `research-state/`, extracted text in `extracted-text/`.
- Sub-agent prompts: `subagents/triage-agent-prompt.md`, `subagents/merge-agent-prompt.md`.
- Reference docs: `README.md`, `CLAUDE.md`, `docs/RESEARCH_WORKFLOW.md`, `docs/SUBAGENT_TESTING.md`, `docs/SUBAGENT_RUNNER.md`, `RESEARCH_BRIEF_PROCESS.md`.

## Supported File Types
- `.pdf` → pdf-parse (full text + page count; image-only PDFs yield little text — use Read tool)
- `.docx` → mammoth (clean text extraction)
- `.pptx` / `.xlsx` → officeparser (text only; images/charts not extracted — use Read tool)
- `.jpg` / `.png` → indexed as metadata only (use Read tool for visual review)
- `.zip` → logged as archive, not extracted (user can unzip manually)

## Document IDs & Collections
- IDs generated from relative path in `ctahr-pdfs/`: lowercase, spaces/special chars → hyphens, extension stripped (e.g., `SMARTS2/bsipes.pdf` → `smarts2/bsipes`).
- Collections = top-level subdirectories in `ctahr-pdfs/`. Loose files → `(root)`.

## Research Workflow Summary
- Start with a brief from `research-briefs/` (available: `ctahr-general.md`) or create one from `_template.md`. Record the brief path in results and state files.
- Apply brief relevance tiers: include Tier 1, include-with-caveat Tier 2, exclude Tier 3.
- Ensure index is up to date: `node index-docs.js` (incremental), `node search-docs.js --stats` (check status).
- Run searches with `search-docs.js`. FTS5 uses BM25 ranking. Use `--type` to filter by file type, `--limit` to adjust result count.
- Review documents with `view-doc.js`, verify against saved text in `extracted-text/`, and note text quality explicitly.
- Use the triage sub-agent for batches of 5-8 documents. Merge results sequentially with the merge sub-agent or use a Node merge script (see `docs/RESEARCH_WORKFLOW.md`).
- Maintain `research-state/{brief-name}.state.json` across sessions. Update `meta.last_session`, keep `search_ids` on documents, and track followups with type/priority/status.
- Update `results/` reports at natural stopping points and include bias observations (collection, document type).

## State Schema (condensed)
```
meta: { brief, results_file, created, last_session }
searches: [{ id, date, term, filters, results_count, noise, effective, intent, notes }]
documents: [{ id, path, title, collection, file_type, pages, author, tier, reason, text_quality, series, text_file, search_ids }]
findings: [{ id, document_id, priority, tags, tags_extra, quote, text_clarity, note }]
followups: [{ id, type, value, source_document_id, priority, status, notes }]
```
Key enums: `text_quality`: good/partial/failed. `text_clarity`: high/medium/low. `noise`: low/medium/high/unknown. `followup.type`: author/series/term/collection/topic-gap/time-gap/source-gap. `followup.status`: pending/tried/completed/blocked.

## Relevance Tiers
- **Tier 1 (Include):** Directly addresses the query with substantial detail (research papers, technical reports, detailed guides).
- **Tier 2 (Include with caveat):** Contains relevant info but not primary focus (annual reports with a relevant section, faculty profiles with research descriptions).
- **Tier 3 (Exclude):** Peripheral mention only (admin docs, passing references, duplicates).

## Extraction Rules (Anti-Inference)
- Never infer or fabricate content. Quote only what is clearly present in extracted text.
- Record `author` only if explicitly stated in the document.
- If text extraction is poor, suggest using the Read tool for visual review.
- Mark uncertain items with [unclear].

## Source Diversity Awareness
- Note when results cluster in one collection or document type.
- Image-only documents and slide decks may be missed by text search — flag this gap.
- Suggest alternative search strategies when bias detected.

## Catalog Management
- Re-index after adding/modifying documents in `ctahr-pdfs/`: `node index-docs.js`.
- Use `--rebuild` if index seems corrupted.
- `catalog.db` and `extracted-text/` are gitignored (auto-generated, can rebuild).

## Build, Test, and Run Commands
```bash
npm install
node index-docs.js                        # build/update index
node index-docs.js --rebuild              # full rebuild
node search-docs.js "soil conservation"   # search
node search-docs.js --stats               # index stats
node search-docs.js "bee" --type pdf      # filter by type
node view-doc.js smarts2/bsipes           # view document by ID
node view-doc.js "ctahr-pdfs/SMARTS2/bsipes.pdf"  # view by path
```
No browser required. All processing is local.

## Coding Style & Naming
- CommonJS (`require`) Node scripts with async IIFEs; prefer `const`/`let`, arrow functions, two-space indentation.
- Keep console output concise (log paths, saved filenames).
- Research summaries: uppercase snake in `results/` (e.g., `SOIL_RESEARCH_RESULTS.md`).
- State files: `research-state/{brief-name}.state.json`.

## Testing & Validation
- No automated suite; validate by running the relevant script and checking console output plus generated files.
- After modifying sub-agent prompts, re-run verification tests in `docs/SUBAGENT_TESTING.md`.
- When using merge scripts or merge agents, verify counts and IDs against expectations.

## Security & Rate Limits
- All data is local. No external API calls or web scraping.
- No credentials stored or needed.
- Triage agent concurrency is limited only by local CPU (no external rate limits).

## Commit & PR Notes
- Use short, imperative subjects (e.g., `Add FTS5 search index for CTAHR documents`).
- PRs should state the research goal, commands run, and outputs produced.
