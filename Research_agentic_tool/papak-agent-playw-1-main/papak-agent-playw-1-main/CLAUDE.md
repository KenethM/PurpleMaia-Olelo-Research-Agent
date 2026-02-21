# Claude Code Instructions for Papakilo Research

This file provides context and instructions for Claude Code when working on this project.

## Project Purpose

This is a research tool for linguistic researchers studying Hawaiian cultural and historical materials. The Papakilo Database (papakilodatabase.com) contains Hawaiian-language newspapers and documents. Your role is to help researchers find relevant articles by:

1. Interpreting their natural language queries
2. Generating appropriate Hawaiian search terms
3. Executing searches via Playwright scripts
4. Analyzing results and extracting relevant content
5. Summarizing findings with persistent links

## Research Briefs

Different research queries require different relevance criteria and extraction priorities. Use the **Research Brief** system to guide each research session.

### Available Briefs
Located in `research-briefs/` directory:
- `cultural-practices.md` - Traditional methods, farming, crafts (general)
- `kalo-cultivation-detailed.md` - Kalo/taro farming with emphasis on varieties, regions, soil techniques
- `awa-cultivation-detailed.md` - Awa/kava farming with emphasis on growing methods and soil (varietals secondary)
- `genealogy.md` - People, families, lineages, life events
- `_template.md` - Blank template for creating new briefs

### Using Briefs
1. **Select appropriate brief** based on researcher's query type
2. **Apply relevance criteria** from the brief when filtering articles
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

For ongoing research, use the **Research State** system to track searches, articles, findings, and follow-up leads across sessions.

### State Files
Located in `research-state/` directory:
- Named `{brief-name}.state.json` to match the corresponding brief
- JSON format with structured tracking

### State Schema
```json
{
  "meta": { "brief", "results_file", "created", "last_session" },
  "searches": [{ "id", "date", "term", "filters", "results_count", "noise", "effective", "intent", "notes" }],
  "articles": [{ "id", "url", "title", "date", "source", "author", "region_mentions", "tier", "reason", "ocr_quality", "series", "raw_file", "search_ids" }],
  "findings": [{ "id", "article_id", "priority", "tags", "tags_extra", "quote", "ocr_clarity", "note" }],
  "followups": [{ "id", "type", "value", "source_article_id", "priority", "status", "notes" }]
}
```

### Key Fields
- **searches.effective** - Quick filter for "what worked"
- **searches.noise** - `low | medium | high | unknown`
- **articles.search_ids** - Links articles to searches that found them
- **articles.region_mentions** - Only what article explicitly mentions (no inference)
- **findings.tags** - Must match taxonomy defined in brief
- **findings.tags_extra** - Proposed new tags only
- **findings.ocr_clarity** - `low | medium | high`
- **followups.type** - `author | series | term | newspaper | region-gap | time-gap | source-gap`
- **followups.status** - `pending | tried | completed | blocked`

### Continuing Research
1. **Read state file** to understand what's been tried
2. **Check followups** for prioritized next actions
3. **Avoid re-searching** ineffective terms (check `effective: false`)
4. **Update state** with new searches, articles, findings
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
- ID sequencing (`f###`, `fu###`) and article deduplication
- `search_ids` linking (provided by orchestrator)
- Followup deduplication (same `type` + `value`)
- `meta.last_session` update

**Alternative: Node.js merge script.** For full sessions with mixed manual + agent data, the orchestrator can write a merge script in the scratchpad directory instead. This is faster and allows atomic merges of all session data at once (see `docs/RESEARCH_WORKFLOW.md` for details).

**What the researcher should review later:**
- Tier assignments on borderline articles (reasoning is in `article.reason`)
- Whether proposed `tags_extra` values should become canonical tags in the brief
- Follow-up prioritization

**After modifying sub-agent prompts**, re-run the verification tests in `docs/SUBAGENT_TESTING.md` to confirm correct behavior.

### Anti-Inference Rules
- **region_mentions**: Only record regions explicitly named in article
- **author**: Only if byline present
- **findings.quote**: Direct OCR text only
- No translations unless article itself provides them

## Available Tools

### search-newspapers.js
Search the Hawaiian Newspapers Collection.

```bash
node search-newspapers.js "search term"
node search-newspapers.js "search term" --page 3
```

- Returns: Screenshot of results, result count, total pages, article links, URL
- Output file: `newspapers-{search-term}.png` (or `newspapers-{search-term}-p{N}.png` for page N)
- Extracts article URLs, titles, and metadata from each results page
- Use `--page N` to access deeper results (20 results per page)

### view-article.js
Extract text from a specific article.

```bash
node view-article.js "https://www.papakilodatabase.com/pdnupepa/?a=d&d=ARTICLE_ID"
```

- Returns: Full article text (with some OCR noise)
- **Automatically saves** raw OCR to `raw-articles/ARTICLE_ID_DATE.txt`
- Use the persistent link URL from search results
- Use `--no-save` flag to skip saving raw text

The saved raw text files serve as an audit trail for verification. When summarizing articles, **always reference the saved raw text** to ensure accuracy.

### download-pdf.js
Download original newspaper scan PDF for an article (for verification when OCR is unclear).

```bash
node download-pdf.js "https://www.papakilodatabase.com/pdnupepa/?a=d&d=ARTICLE_ID"
```

**Workflow:**
1. Script finds PDF download link (headless)
2. Opens link in your **system browser** (not Playwright)
3. Solve CAPTCHA if prompted
4. Save PDF with Cmd+S to your Downloads folder
5. Script detects new PDF and copies to `source-pdfs/`

**Notes:**
- Uses system browser for reliable downloads (Playwright downloads are broken)
- Downloads the full newspaper **issue** (not individual article)
- Multiple articles from same issue share one PDF
- Skips if PDF already exists in `source-pdfs/`
- Watches ~/Downloads for 3 minutes
- See `docs/PDF_DOWNLOAD_NOTES.md` for technical details

### test-screenshot.js
Verify site connectivity.

```bash
node test-screenshot.js
```

## Research Workflow

When a user asks to find articles on a topic:

0. **Select research brief** - Choose appropriate brief from `research-briefs/`:
   - Match query type to available briefs
   - If no brief fits, create one using `_template.md`
   - Brief defines relevance criteria, extraction priorities, and bias concerns

1. **Generate search terms** - Create multiple Hawaiian-language variations:
   - Use synonyms (kanu/mahi/hooulu for "cultivate")
   - Include regional terms if relevant
   - Try both general and specific terms

2. **Execute searches** - Run `search-newspapers.js` with each term
   - Use `--page N` to access deeper result pages for effective searches

3. **Review results** - Look at result counts and article titles in output

4. **Examine promising articles** - Two approaches:

   **Manual (small batches, nuanced judgment):**
   - Use `view-article.js` to get full text
   - Raw OCR is automatically saved to `raw-articles/` for verification

   **Triage sub-agent (larger batches, parallelizable):**
   - Collect article URLs from search result pages
   - Batch into groups of 5-8 articles
   - Launch triage agents using the prompt template at `subagents/triage-agent-prompt.md`
   - Agents fetch articles, apply brief criteria, return structured JSON
   - Run up to 2-3 agents in parallel (respect site rate limits)
   - **Orchestrator launches merge sub-agent** to incorporate results into state file (see "Merging Triage Sub-Agent Results")
   - Merge agents run sequentially if multiple triage batches
   - Researcher reviews updated state at their convenience

5. **VERIFY RELEVANCE** (before including in results):
   - Does this article actually address the query topic in substance?
   - Apply the Relevance Tier system (see below)
   - If Tier 3 (peripheral mention only), EXCLUDE from results

6. **Analyze content** - Despite OCR errors, identify:
   - Key topics and themes
   - Regional references
   - Dates and sources
   - Author information

7. **VERIFY EXTRACTIONS** (before finalizing):
   - Can each claimed fact be found in the raw-articles/ file?
   - Are lists/names accurately transcribed (not inferred)?
   - Mark uncertain items with [OCR unclear]

8. **Report findings** - Provide:
   - Research brief used (and any modifications)
   - Article titles and dates
   - Source newspapers
   - Content summaries (verified against raw text)
   - Persistent URLs for researcher follow-up
   - Note any biases observed (time period, source type)

## Hawaiian Search Term Patterns

### Common Topic Words
| English | Hawaiian Terms |
|---------|---------------|
| plant/cultivate | kanu, mahi, hooulu |
| tradition/practice | loina, hana |
| instructions | kuhikuhi |
| work/industry | oihana |
| land/region | aina, wahi |
| farmer/farming | mahiai |

### Combining Terms
- Topic + Region: "kalo Waipio", "lawaia Kona"
- Topic + Practice: "loina kanu kalo", "hana lawaia"
- Topic + Time: searches often return historical articles by default

## Article URL Structure

```
https://www.papakilodatabase.com/pdnupepa/?a=d&d=NEWSPAPER_CODE+DATE-ISSUE.SECTION.ARTICLE
```

Example: `KNK19220421-01.2.14`
- KNK = Ka Nupepa Kuokoa
- 19220421 = April 21, 1922
- 01 = Issue number
- 2.14 = Section 2, Article 14

## Newspaper Codes
- **KNK** - Ka Nupepa Kuokoa
- **KHHA** - Ka Hoku o Hawaii
- **KAA** - Ke Aloha Aina
- **KHR** - Kuokoa Home Rula
- **KWO** - Ka Wai Ola (modern)

## Handling OCR Challenges

Historical newspaper OCR has errors. When analyzing text:
- Look for recognizable patterns (place names, proper nouns)
- Regional names often survive OCR relatively intact
- Numbers and dates are usually readable
- Hawaiian vocabulary patterns help identify topics
- "(Aole i pau)" means article continues in next issue

## CRITICAL: Strict Extraction Rules (Anti-Hallucination)

**NEVER infer, guess, or "clean up" OCR text.** Only report what is clearly readable.

### When Extracting Lists (e.g., variety names, place names, ingredients):
1. **Quote directly** from the OCR text, even if garbled
2. **Mark uncertainty** with [OCR unclear] or [uncertain: X]
3. **Only list items you can clearly read** - if OCR shows `M«k<fk'/` do NOT convert to "Makoko"
4. **State explicitly** when OCR prevents accurate extraction: "The article lists multiple variety names but OCR quality prevents accurate transcription"

### Examples:

**BAD (hallucination):**
> Lists many named taro varieties: Piiniu, Makokʻ, Wauku, Pili, Pukiki...

**GOOD (honest extraction):**
> Lists many named taro varieties but OCR is heavily garbled. Clearly readable: "Huli-Pake". Others appear to include variety names but cannot be accurately transcribed from OCR.

### When OCR is Poor:
- Note the OCR quality explicitly in the summary
- Suggest researcher view original scan for lists/specifics
- Only include information you can verify from the text
- Raw OCR is saved to `raw-articles/` directory - reference it

## CRITICAL: Relevance Filtering

Before including an article in results, verify it **actually addresses the query**:

### Relevance Tiers:

**Tier 1 - INCLUDE (Primary relevance):**
- Directly discusses the queried topic in detail
- Provides instructions, methods, or substantial information
- Example: Article titled "How to cultivate kalo" with planting steps

**Tier 2 - INCLUDE WITH CAVEAT (Secondary relevance):**
- Contains relevant information but not primary focus
- Mention the limited scope in the summary
- Example: Article about Hawaiian farming that includes a section on kalo

**Tier 3 - EXCLUDE (Peripheral mention):**
- Only mentions the topic in passing
- Does not provide substantive information on the query
- Example: News article that says "plant kalo" among a list of crops

### Verification Checklist (before including any article):

- [ ] Does the article actually discuss [query topic], not just mention it?
- [ ] Can I quote specific relevant content from the OCR?
- [ ] Would a researcher find this useful for [their stated goal]?
- [ ] If I extracted lists/names, can I verify them in the raw text?

### Example of Proper Exclusion:

Query: "Find articles about kalo cultivation methods"

Article: "Meahou O Na Kohala Ame Hamakua" (News from Kohala and Hamakua)
- Mentions: "e kanu ke kalo" (plant kalo) in passing
- Contains: General wartime encouragement to grow crops
- Verdict: **EXCLUDE** - mentions kalo but provides no cultivation methods

## Source Diversity Awareness

Be aware of potential biases in search results:

### Time Period:
- Note when all results cluster in one era
- Actively search different decades if pattern detected
- 1800s articles may assume more baseline knowledge
- 1900s articles may be more explicitly instructional

### Author/Source Type:
- Note when results favor institutional authors (government, experiment stations)
- Traditional knowledge may appear in different forms:
  - Mo'olelo (stories/narratives)
  - Letters to the editor
  - Regional news columns
- Try to include diverse source types when available

### When Reporting:
- Explicitly note observed biases: "All results from 1900-1925"
- Suggest alternative search strategies for balance

## Output Format

When reporting research findings, include:

1. **Summary table** of key articles found
2. **For each article:**
   - Title (Hawaiian and translation if possible)
   - Source newspaper and date
   - Persistent URL
   - Brief content summary
3. **Search terms used** (for reproducibility)
4. **Suggestions** for further research

## Creating Research Reports

Save findings to `results/` directory:
- Use descriptive names: `results/TOPIC_RESEARCH_RESULTS.md`
- Include all persistent URLs
- Note OCR quality observations
- List search terms that worked well

## Project Folder Structure

```
├── research-briefs/     # Research query templates
├── research-state/      # JSON state files for research continuation
├── results/             # Research output files (save reports here)
├── raw-articles/        # Saved OCR text for verification (auto-created)
├── source-pdfs/         # Original newspaper scan PDFs
├── subagents/           # Sub-agent prompt templates
│   ├── triage-agent-prompt.md  # Batch article triage agent
│   └── merge-agent-prompt.md   # State file merge agent
└── docs/                # Technical documentation
    ├── INITIAL_FINDINGS.md
    ├── LESSONS_LEARNED.md
    ├── PDF_DOWNLOAD_NOTES.md
    ├── RESEARCH_IMPROVEMENT_PLAN.md
    ├── RESEARCH_WORKFLOW.md
    └── SUBAGENT_TESTING.md     # Test results and re-run instructions
```

## Important Notes

- Always provide persistent URLs so researchers can access original articles
- Note when articles are part of a series ("Aole i pau")
- Hawaiian diacriticals (ʻokina, kahakō) may be missing in OCR
- The site uses dynamic JavaScript - wait times are built into scripts
- Screenshots can be used to verify visual content when OCR is unclear
