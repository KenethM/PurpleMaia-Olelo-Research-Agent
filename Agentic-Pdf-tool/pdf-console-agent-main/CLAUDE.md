# Claude Code Instructions for CTAHR Document Research

This file provides context and instructions for Claude Code when working on this project.

**IMPORTANT: Keep `AGENTS.md` in sync with this file.** Both files describe the same project rules and workflow. `CLAUDE.md` is the detailed reference; `AGENTS.md` is the condensed version. When updating rules, workflow, or tool documentation here, update the corresponding section in `AGENTS.md` as well. If they conflict, this file (`CLAUDE.md`) is authoritative.

## Project Purpose

This is a research tool for exploring a local collection of CTAHR (UH College of Tropical Agriculture and Human Resources) documents. The collection is ~15-16 GB of mixed-format files (PDFs, DOCX, PPTX, images). Your role is to help researchers find relevant documents by:

1. Interpreting their natural language queries
2. Generating appropriate search terms
3. Searching the indexed document catalog
4. Analyzing results and extracting relevant content
5. Summarizing findings with document paths and IDs

## Research Briefs

Different research queries require different relevance criteria and extraction priorities. Use the **Research Brief** system to guide each research session.

### Available Briefs
Located in `research-briefs/` directory:
- `ctahr-general.md` - General-purpose brief for exploring the CTAHR collection
- `_template.md` - Blank template for creating new briefs

### Using Briefs
1. **Select appropriate brief** based on researcher's query type
2. **Apply relevance criteria** from the brief when filtering documents
3. **Follow extraction priorities** when summarizing content
4. **Note bias concerns** from the brief in results
5. **Record which brief was used** in the results file

### Creating New Briefs
When a query doesn't fit existing briefs:
1. Use `_template.md` as starting point
2. Define relevance tiers specific to the query type
3. Set extraction priorities based on what matters for this research
4. Identify relevant bias concerns
5. Save to `research-briefs/` for reuse

See `RESEARCH_BRIEF_PROCESS.md` for detailed guidance on creating new briefs through natural language interaction.

## Research State (Continuation System)

For ongoing research, use the **Research State** system to track searches, documents, findings, and follow-up leads across sessions.

### State Files
Located in `research-state/` directory:
- Named `{brief-name}.state.json` to match the corresponding brief
- JSON format with structured tracking

### State Schema
```json
{
  "meta": { "brief", "results_file", "created", "last_session" },
  "searches": [{ "id", "date", "term", "filters", "results_count", "noise", "effective", "intent", "notes" }],
  "documents": [{ "id", "path", "title", "collection", "file_type", "pages", "author", "tier", "reason", "text_quality", "series", "text_file", "search_ids" }],
  "findings": [{ "id", "document_id", "priority", "tags", "tags_extra", "quote", "text_clarity", "note" }],
  "followups": [{ "id", "type", "value", "source_document_id", "priority", "status", "notes" }]
}
```

### Key Fields
- **searches.effective** - Quick filter for "what worked"
- **searches.noise** - `low | medium | high | unknown`
- **documents.search_ids** - Links documents to searches that found them
- **documents.text_quality** - `good | partial | failed` (replaces old ocr_quality)
- **findings.tags** - Must match taxonomy defined in brief
- **findings.tags_extra** - Proposed new tags only
- **findings.text_clarity** - `high | medium | low`
- **followups.type** - `author | series | term | collection | topic-gap | time-gap | source-gap`
- **followups.status** - `pending | tried | completed | blocked`

### Continuing Research
1. **Read state file** to understand what's been tried
2. **Check followups** for prioritized next actions
3. **Avoid re-searching** ineffective terms (check `effective: false`)
4. **Update state** with new searches, documents, findings
5. **Update `last_session`** in meta

### Merging Triage Sub-Agent Results

After triage sub-agents return JSON results, the orchestrator launches a **merge sub-agent** to incorporate them into the state file. This keeps the merge logic isolated, reproducible, and context-clean.

**Merge agent prompt:** `subagents/merge-agent-prompt.md`

**How to invoke:**
1. Triage agent returns JSON output
2. Launch merge agent with: state file path, triage JSON, and search IDs to assign
3. Merge agent reads current state, deduplicates, assigns IDs, appends, writes updated state
4. If multiple triage batches need merging, run merge agents **sequentially** (each reads the latest state including prior merges)

**What the merge agent handles:**
- ID sequencing (`f###`, `fu###`) and document deduplication
- `search_ids` linking (provided by orchestrator)
- Followup deduplication (same `type` + `value`)
- `meta.last_session` update

**Alternative: Node.js merge script.** For full sessions with mixed manual + agent data, the orchestrator can write a merge script in the scratchpad directory instead. This is faster and allows atomic merges of all session data at once (see `docs/RESEARCH_WORKFLOW.md` for details).

**What the researcher should review later:**
- Tier assignments on borderline documents (reasoning is in `document.reason`)
- Whether proposed `tags_extra` values should become canonical tags in the brief
- Follow-up prioritization

**After modifying sub-agent prompts**, re-run the verification tests in `docs/SUBAGENT_TESTING.md` to confirm correct behavior.

### Anti-Inference Rules
- **author**: Only if explicitly stated in the document
- **findings.quote**: Direct extracted text only
- No assumptions about document purpose beyond what the content states

## Available Tools

### index-docs.js
Build or update the searchable document index.

```bash
node index-docs.js                    # index all, skip already-indexed
node index-docs.js --rebuild          # drop and rebuild entire index
```

- Walks `ctahr-pdfs/` recursively
- Extracts text from PDFs (pdf-parse), DOCX (mammoth), PPTX/XLSX (officeparser)
- Images (.jpg, .png) logged as metadata-only (use Read tool to view)
- Archives (.zip) logged but not extracted
- Creates `catalog.db` (SQLite with FTS5) and saves text to `extracted-text/`
- Incremental: skips files already indexed with same size + modification time

### search-docs.js
Search the indexed document catalog.

```bash
node search-docs.js "soil conservation"
node search-docs.js "bee habitat" --limit 20
node search-docs.js "ruminant" --type pdf
node search-docs.js --stats
```

- Uses SQLite FTS5 with BM25 ranking
- Returns: id, filename, path, collection, file_type, pages, snippet, text_length
- Default limit: 20 results
- `--stats` shows: total docs, collections, file types, index date
- `--type` filters by file extension (pdf, docx, pptx, etc.)

### view-doc.js
Extract and display text from a single document.

```bash
node view-doc.js "ctahr-pdfs/SMARTS2/bsipes.pdf"   # by path
node view-doc.js smarts2/bsipes                      # by catalog ID
node view-doc.js smarts2/bsipes --no-save
```

- Detects format from extension, uses appropriate extraction library
- Prints full text to stdout
- Saves to `extracted-text/{id}_{date}.txt` (unless `--no-save`)
- Also accepts catalog ID and resolves to path via DB lookup

### Read Tool (for visual content)
For documents with tables, images, charts, or slides:

```
Use the Read tool directly on the file path
```

- Claude can view PDFs and images directly via multimodal rendering
- Use this when text extraction misses visual content (charts, diagrams, tables in images)
- Especially useful for PPTX slide decks and image-only PDFs

## Supported File Types

| Extension | Extraction Method | Notes |
|-----------|-------------------|-------|
| `.pdf` | pdf-parse | Full text + page count. Image-only PDFs yield little text — use Read tool |
| `.docx` | mammoth | Clean text extraction |
| `.pptx` | officeparser | Text from slides; images/charts not extracted — use Read tool |
| `.xlsx` | officeparser | Cell text extraction |
| `.jpg/.png` | (none) | Indexed as metadata only. Use Read tool for visual review |
| `.zip` | (none) | Logged as archive. Unzip manually if needed |

## Research Workflow

When a user asks to find documents on a topic:

0. **Select research brief** - Choose appropriate brief from `research-briefs/`:
   - Match query type to available briefs
   - If no brief fits, create one using `_template.md`
   - Brief defines relevance criteria, extraction priorities, and bias concerns

1. **Catalog management** - Ensure index is up to date:
   - Run `node index-docs.js` if new documents were added to `ctahr-pdfs/`
   - Use `node search-docs.js --stats` to check index status

2. **Generate search terms** - Create multiple keyword variations:
   - Use synonyms and related terms
   - Try both general and specific terms
   - Consider scientific names, common names, abbreviations

3. **Execute searches** - Run `search-docs.js` with each term
   - Review result counts and snippets
   - Try `--type` filter if results are noisy

4. **Examine promising documents** - Two approaches:

   **Manual (small batches, nuanced judgment):**
   - Use `view-doc.js` to get full text
   - Extracted text is automatically saved to `extracted-text/` for verification
   - For visual content, use the Read tool directly on the file

   **Triage sub-agent (larger batches, parallelizable):**
   - Collect document paths/IDs from search results
   - Batch into groups of 5-8 documents
   - Launch triage agents using the prompt template at `subagents/triage-agent-prompt.md`
   - Agents extract text, apply brief criteria, return structured JSON
   - **Orchestrator launches merge sub-agent** to incorporate results into state file
   - Researcher reviews updated state at their convenience

5. **VERIFY RELEVANCE** (before including in results):
   - Does this document actually address the query topic in substance?
   - Apply the Relevance Tier system (see below)
   - If Tier 3 (peripheral mention only), EXCLUDE from results

6. **Analyze content** - Identify:
   - Key topics and themes
   - Authors and affiliations
   - Dates and context
   - Related documents or series

7. **VERIFY EXTRACTIONS** (before finalizing):
   - Can each claimed fact be found in the extracted-text/ file?
   - Are lists/names accurately transcribed?
   - Mark uncertain items with [unclear]

8. **Report findings** - Provide:
   - Research brief used (and any modifications)
   - Document titles and collections
   - Content summaries (verified against extracted text)
   - Document paths and catalog IDs for follow-up
   - Note any biases observed (collection, document type)

## Document ID Structure

Generated from the relative path within `ctahr-pdfs/`:
```
smarts2/bsipes      ← from SMARTS2/bsipes.pdf
smarts2/dahl        ← from SMARTS2/Dahl.pdf
vetext/report-2024  ← from VetExt/Report 2024.docx
```

IDs are lowercase, with spaces/special chars replaced by hyphens, extension stripped.

## Collection Structure

Collections correspond to top-level subdirectories within `ctahr-pdfs/`:
```
ctahr-pdfs/
├── SMARTS2/           → collection: "smarts2"
├── VetExt-to-.../     → collection: "vetext-to-..."
└── (loose files)      → collection: "(root)"
```

## Document Text Extraction Notes

- **PDFs**: Most extract cleanly. Image-only PDFs (scanned without OCR) will have little or no text — use the Read tool to view these visually. Some PDFs with complex layouts may have garbled text ordering.
- **DOCX**: Generally extracts cleanly. Embedded images and charts are not captured — use Read tool.
- **PPTX**: Text from slides is extracted but formatting is lost. Charts, images, and diagrams are not captured — use Read tool for visual review of slide content.
- **XLSX**: Cell text is extracted. Formatting, formulas, and charts are not captured.

## CRITICAL: Strict Extraction Rules (Anti-Hallucination)

**NEVER infer, guess, or fabricate content.** Only report what is clearly present in the extracted text.

### When Extracting Information:
1. **Quote directly** from the extracted text
2. **Mark uncertainty** with [unclear] or [uncertain: X]
3. **Only list items you can clearly read** in the extracted text
4. **State explicitly** when extraction prevents accurate reading: "The document appears to contain a data table but text extraction did not preserve the structure"

### Examples:

**BAD (hallucination):**
> The document discusses five soil conservation methods: terracing, contour plowing, cover cropping, mulching, and no-till farming.

**GOOD (honest extraction):**
> The document discusses soil conservation methods. Clearly extractable: "terracing" and "contour plowing" are discussed in detail. Additional methods appear to be listed but text extraction from the table did not preserve readable structure — use Read tool for visual review.

### When Text Extraction is Poor:
- Note the extraction quality explicitly in the summary
- Suggest researcher view original document with Read tool
- Only include information you can verify from the extracted text
- Extracted text is saved to `extracted-text/` directory — reference it

## CRITICAL: Relevance Filtering

Before including a document in results, verify it **actually addresses the query**:

### Relevance Tiers:

**Tier 1 - INCLUDE (Primary relevance):**
- Directly discusses the queried topic in detail
- Provides research findings, methods, or substantial information
- Example: A research paper on soil conservation practices in Hawaii

**Tier 2 - INCLUDE WITH CAVEAT (Secondary relevance):**
- Contains relevant information but not primary focus
- Mention the limited scope in the summary
- Example: A CTAHR annual report that includes a section on soil research

**Tier 3 - EXCLUDE (Peripheral mention):**
- Only mentions the topic in passing
- Does not provide substantive information on the query
- Example: A faculty bio that lists "soil science" as a research interest

### Verification Checklist (before including any document):

- [ ] Does the document actually discuss [query topic], not just mention it?
- [ ] Can I quote specific relevant content from the extracted text?
- [ ] Would a researcher find this useful for [their stated goal]?
- [ ] If I extracted lists/data, can I verify them in the extracted text?

## Source Diversity Awareness

Be aware of potential biases in search results:

### Collection Bias:
- Note when all results come from one collection/subfolder
- Different collections may represent different programs, time periods, or content types
- Try searching across collections when pattern detected

### Document Type Bias:
- PDF research papers may dominate results over slide presentations that contain relevant info
- Image-only documents won't appear in text searches — note this gap
- Slide decks may have minimal extractable text but rich visual content

### When Reporting:
- Explicitly note observed biases: "All results from SMARTS2 collection"
- Suggest alternative search strategies for balance
- Note when visual-content documents may be missing from text-based search results

## Output Format

When reporting research findings, include:

1. **Summary table** of key documents found
2. **For each document:**
   - Title/filename
   - Collection and file type
   - Catalog ID and path
   - Brief content summary
3. **Search terms used** (for reproducibility)
4. **Suggestions** for further research

## Creating Research Reports

Save findings to `results/` directory:
- Use descriptive names: `results/TOPIC_RESEARCH_RESULTS.md`
- Include all document paths and catalog IDs
- Note text extraction quality observations
- List search terms that worked well

## Catalog Management

### When to Re-index
- After adding new documents to `ctahr-pdfs/`
- After unzipping archive files
- After modifying existing documents
- Use `--rebuild` flag if the index seems corrupted or out of sync

### Index Files
- `catalog.db` — SQLite database (auto-generated, can rebuild)
- `extracted-text/` — One `.txt` file per document (audit trail)

## Project Folder Structure

```
├── research-briefs/     # Research query templates
├── research-state/      # JSON state files for research continuation
├── results/             # Research output files (save reports here)
├── extracted-text/      # Saved extracted text for verification (auto-created)
├── ctahr-pdfs/          # Source document collection (not in git)
├── catalog.db           # SQLite search index (auto-generated, not in git)
├── subagents/           # Sub-agent prompt templates
│   ├── triage-agent-prompt.md  # Batch document triage agent
│   └── merge-agent-prompt.md   # State file merge agent
└── docs/                # Technical documentation
    ├── RESEARCH_WORKFLOW.md
    ├── SUBAGENT_TESTING.md
    └── SUBAGENT_RUNNER.md
```

## Important Notes

- Always provide document paths and catalog IDs so researchers can access originals
- For visual content (charts, tables, images), use the Read tool directly
- The `extracted-text/` directory serves as an audit trail for verification
- Re-index after adding documents: `node index-docs.js`
