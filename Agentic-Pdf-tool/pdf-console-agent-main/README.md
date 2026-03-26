# CTAHR Document Research Tool

A research tool using Claude Code to enable flexible, natural language exploration of a local CTAHR (UH College of Tropical Agriculture and Human Resources) document collection. Indexes and searches PDFs, DOCX, PPTX, and other file formats using SQLite FTS5 full-text search.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Researcher enters natural language query:                  │
│  "Find documents about soil conservation in Hawaii"         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI Agent generates search terms and variations:            │
│  "soil conservation", "erosion control", "cover crop", etc. │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Searches local SQLite FTS5 index of document collection    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Agent analyzes results, extracts text, identifies          │
│  relevant documents, and reports findings                   │
└─────────────────────────────────────────────────────────────┘
```

## Setup

```bash
npm install
```

Place your CTAHR document collection in `ctahr-pdfs/`. Then build the index:

```bash
node index-docs.js
```

No browser or external services required. Everything runs locally.

## Usage

### With Claude Code (Primary Method)

Start a Claude Code session and describe your research query in natural language:

```
"Find documents about bee habitat and pollinator health"
```

The agent will:
- Generate appropriate search terms
- Search the indexed document catalog
- Review and analyze results
- Report findings with document paths

### Manual Script Usage

**Build/update the index:**
```bash
node index-docs.js                    # incremental (skip unchanged)
node index-docs.js --rebuild          # full rebuild
```

**Search documents:**
```bash
node search-docs.js "soil conservation"
node search-docs.js "ruminant nutrition" --limit 10
node search-docs.js "bee" --type pdf
node search-docs.js --stats
```

**View a specific document:**
```bash
node view-doc.js smarts2/bsipes                      # by catalog ID
node view-doc.js "ctahr-pdfs/SMARTS2/bsipes.pdf"     # by path
node view-doc.js smarts2/bsipes --no-save
```

## Supported File Types

| Format | Extraction | Notes |
|--------|-----------|-------|
| PDF | pdf-parse | Full text + page count |
| DOCX | mammoth | Clean text extraction |
| PPTX | officeparser | Slide text (images not extracted) |
| XLSX | officeparser | Cell text |
| JPG/PNG | metadata only | Use Read tool for visual review |

## Project Structure

```
├── CLAUDE.md                     # Instructions for AI agent
├── README.md                     # This file
├── RESEARCH_BRIEF_PROCESS.md     # How to create new research briefs
│
├── index-docs.js                 # Build/update document index
├── search-docs.js                # Search the catalog
├── view-doc.js                   # Extract + display document text
│
├── subagents/                    # Sub-agent prompt templates
│   ├── triage-agent-prompt.md    # Batch document triage agent
│   └── merge-agent-prompt.md     # State file merge agent
│
├── docs/                         # Technical documentation
│   ├── RESEARCH_WORKFLOW.md      # End-to-end research process guide
│   ├── SUBAGENT_RUNNER.md        # Sub-agent runner usage
│   └── SUBAGENT_TESTING.md       # Sub-agent test verification
│
├── results/                      # Research output files
├── research-briefs/              # Research query templates
│   ├── _template.md              # Blank template
│   └── ctahr-general.md          # General CTAHR collection brief
│
├── research-state/               # Session state files (JSON)
├── extracted-text/               # Saved extracted text (auto-created, gitignored)
├── ctahr-pdfs/                   # Source documents (gitignored)
└── catalog.db                    # SQLite FTS5 index (gitignored)
```

## Deep Search with Sub-Agents

For large-scale document review, the project includes a **triage sub-agent** that can process batches of documents in parallel within Claude Code:

1. Search for relevant documents
2. Collect paths/IDs from results
3. Launch triage agents (using `subagents/triage-agent-prompt.md`) to extract, tier-assess, and capture findings
4. Review agent output, then merge into the research state file

See `docs/RESEARCH_WORKFLOW.md` for the full process.

## Limitations

- Image-only PDFs (scanned without OCR) yield little extractable text
- PPTX charts and images are not captured in text extraction
- Complex table layouts in PDFs may not extract cleanly
- Use Claude's Read tool for visual review of any document with important non-text content

## Contributing

This is a research project for nonprofit and community partners. Contact the project maintainers for collaboration opportunities.

## License

ISC
