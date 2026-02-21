# Papakilo Natural Language Search Research Tool

A research experiment using Playwright and AI coding agents (Claude Code) to enable flexible, natural language searches of the [Papakilo Database](https://papakilodatabase.com) - a collection of Hawaiian cultural and historical materials.

## Project Goal

The Papakilo Database has a rich collection of Hawaiian language newspapers and historical documents, but uses traditional keyword search. Our linguistic researchers need more flexible search capabilities that can:

1. Interpret natural language research questions
2. Generate appropriate Hawaiian-language search terms
3. Execute searches and retrieve results
4. Analyze article content (despite OCR limitations)
5. Summarize findings with persistent links for further study

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Researcher enters natural language query:                  │
│  "Find historical articles about growing taro in Waipio"   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI Agent interprets and generates Hawaiian search terms:   │
│  "kanu kalo", "Waipio loi", "mahi kalo", etc.              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Playwright executes searches on papakilodatabase.com       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Agent analyzes results, extracts text, identifies          │
│  relevant articles, and reports findings                    │
└─────────────────────────────────────────────────────────────┘
```

## Setup

```bash
npm install
```

Requires Chrome/Chromium browser installed on the system.

## Usage

### With Claude Code (Primary Method)

Start a Claude Code session and describe your research query in natural language:

```
"Find newspaper articles about traditional Hawaiian fishing practices in Kona"
```

The agent will:
- Generate appropriate search terms
- Run searches using the Playwright scripts
- Review and analyze results
- Report findings with article links

### Manual Script Usage

**Search newspapers:**
```bash
node search-newspapers.js "kanu kalo"
node search-newspapers.js "kanu kalo" --page 2
```

**View a specific article:**
```bash
node view-article.js "https://www.papakilodatabase.com/pdnupepa/?a=d&d=KNK19030327-01.2.34"
```
- Automatically saves raw OCR text to `raw-articles/` for verification

**Download original PDF scan:**
```bash
node download-pdf.js "https://www.papakilodatabase.com/pdnupepa/?a=d&d=KNK19030327-01.2.34"
```
- Opens in system browser (CAPTCHA required)
- Watches ~/Downloads and copies to `source-pdfs/`
- See `docs/PDF_DOWNLOAD_NOTES.md` for technical details

**Test site connectivity:**
```bash
node test-screenshot.js
```

## Project Structure

```
├── CLAUDE.md                     # Instructions for AI agent
├── README.md                     # This file
├── RESEARCH_BRIEF_PROCESS.md     # How to create new research briefs
│
├── search-newspapers.js          # Newspaper collection search (supports --page N)
├── view-article.js               # Article text extraction (saves to raw-articles/)
├── download-pdf.js               # PDF download helper (saves to source-pdfs/)
├── test-screenshot.js            # Site verification
│
├── subagents/                    # Sub-agent prompt templates for Claude Code
│   ├── triage-agent-prompt.md    # Batch article triage agent
│   └── merge-agent-prompt.md     # State file merge agent
│
├── docs/                         # Technical documentation
│   ├── INITIAL_FINDINGS.md       # Site structure analysis
│   ├── LESSONS_LEARNED.md        # Technical discoveries
│   ├── PDF_DOWNLOAD_NOTES.md     # PDF download implementation notes
│   ├── RESEARCH_IMPROVEMENT_PLAN.md  # Feedback-driven improvements
│   ├── RESEARCH_WORKFLOW.md      # End-to-end research process guide
│   └── SUBAGENT_TESTING.md       # Sub-agent test results and verification
│
├── results/                      # Research output files
│   └── KALO_RESEARCH_RESULTS.md  # Example: taro cultivation research
│
├── research-briefs/              # Research query templates
│   ├── _template.md              # Blank template
│   ├── cultural-practices.md     # Traditional methods research
│   ├── kalo-cultivation-detailed.md  # Kalo-specific research
│   └── genealogy.md              # Family/people research
│
├── raw-articles/                 # Saved OCR text for verification (auto-created)
└── source-pdfs/                  # Original newspaper scan PDFs
```

## Research Results

| Topic | File | Key Findings |
|-------|------|--------------|
| Kalo (Taro) Cultivation | `results/KALO_RESEARCH_RESULTS.md` | 5 key articles from 1903-1942 with regional farming advice |

## Deep Search with Sub-Agents

For large-scale article review, the project includes a **triage sub-agent** that can process batches of articles in parallel within Claude Code:

1. Page through effective search results: `node search-newspapers.js "term" --page 2`
2. Collect article URLs from deeper result pages
3. Launch triage agents (using `subagents/triage-agent-prompt.md`) to fetch, tier-assess, and extract findings
4. Review agent output, then merge into the research state file

See `docs/RESEARCH_WORKFLOW.md` for the full process.

## Key Resources

- **Papakilo Database:** https://papakilodatabase.com
- **Hawaiian Newspapers Collection:** https://www.papakilodatabase.com/pdnupepa/
- **Article URL Pattern:** `/pdnupepa/?a=d&d=NEWSPAPER_DATE-ISSUE.SECTION.ARTICLE`

## Newspaper Codes

| Code | Newspaper |
|------|-----------|
| KNK | Ka Nupepa Kuokoa |
| KHHA | Ka Hoku o Hawaii |
| KAA | Ke Aloha Aina |
| KWO | Ka Wai Ola |

## Limitations

- OCR quality varies on historical newspapers
- Hawaiian diacriticals often missing in OCR text
- Some searches require multiple term variations
- Site uses dynamic JavaScript loading
- PDF downloads require CAPTCHA (semi-manual process)
- Playwright's sandboxed browser has broken downloads - uses system browser instead (see `PDF_DOWNLOAD_NOTES.md`)

## Contributing

This is a research project for nonprofit and community partners. Contact the project maintainers for collaboration opportunities.

## License

ISC
