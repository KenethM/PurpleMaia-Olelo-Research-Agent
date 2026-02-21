# Research Workflow Guide

This document describes the end-to-end process for conducting research using the Papakilo newspaper database, from defining a research brief through continuation across multiple sessions.

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Define      │     │  2. Initial     │     │  3. Save        │
│  Research Brief │ ──▶ │  Search Session │ ──▶ │  State          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  5. Update      │     │  4. Continue    │
                        │  Results        │ ◀── │  Research       │
                        └─────────────────┘     └─────────────────┘
                                │                       │
                                └───────────────────────└──▶ (repeat)

Deep search variation (Phase 4 with sub-agents):

┌──────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│ Page through  │     │ Batch articles   │     │ Triage agents│     │ Human review │
│ effective     │ ──▶ │ into groups of   │ ──▶ │ run in       │ ──▶ │ + merge into │
│ searches      │     │ 5-8              │     │ parallel     │     │ state        │
└──────────────┘     └──────────────────┘     └──────────────┘     └──────────────┘
```

## Phase 1: Define Research Brief

### When to Create a New Brief

Create a new brief when:
- Research topic doesn't fit existing briefs
- Different relevance criteria needed than existing briefs
- Specific extraction priorities differ from available templates

### Process

1. **Review existing briefs** in `research-briefs/` for similar templates
2. **Identify a model brief** to adapt (e.g., `kalo-cultivation-detailed.md` for crop research)
3. **Define the research goal** with the researcher through natural language discussion
4. **Extract key parameters:**
   - What makes an article highly relevant vs moderately relevant vs excludable?
   - What information should be extracted first? (priority order)
   - What sources are preferred?
   - What biases should we watch for?

### Example: Awa Cultivation Brief

**Researcher's request:**
> "The new brief should be for the crop awa (kava). We really want a specific focus for materials related to farming/growing awa or soil nutrition for awa specifically (it is less important to have varietals of awa if the article doesn't have farming or soil info)"

**Key parameters extracted:**
- **Primary focus:** Farming methods, soil nutrition
- **Secondary focus:** Varietals only when tied to growing info
- **Model brief:** `kalo-cultivation-detailed.md` (similar crop research structure)

**Brief sections to define:**

| Section | Purpose |
|---------|---------|
| Research Goal | What we're looking for, with emphasis areas |
| Relevance Criteria | Tier 1/2/3 definitions for filtering |
| Extraction Priorities | Ordered list of what to capture |
| Extraction Taxonomy | Canonical tags for findings |
| Source Weighting | Preferred vs acceptable sources |
| Bias Awareness | Known issues to watch for |
| Search Strategy | Initial search terms by category |
| OCR Handling | Domain-specific OCR guidance |

### Extraction Taxonomy

Define 6-12 theme-based tags in the brief:

```markdown
## Extraction Taxonomy

| Tag | Description |
|-----|-------------|
| `propagation` | Planting, cutting, transplanting methods |
| `soil` | Soil types, preparation, amendments |
| `variety` | Named cultivars with growing characteristics |
| `harvest` | When/how to harvest, maturity indicators |
| `regional-practice` | Place-specific methods or variations |
```

**Rules:**
- Theme tags only (not metadata like `region` - use `region_mentions` in state)
- Keep stable across sessions
- Use `tags_extra` in state file for proposed additions

---

## Phase 2: Initial Search Session

### Setup

1. Confirm the brief file is saved to `research-briefs/`
2. Review the Search Strategy section for initial terms
3. Scripts ready:
   - `search-newspapers.js` - screenshots, result counts, article links, pagination (`--page N`)
   - `search-kalo.js` - extracts article URLs (legacy; `search-newspapers.js` now does this too)

### Search Execution

**CRITICAL: The search engine performs OR-matching on multi-word queries.** A search for "kanu awa laau" returns articles matching "kanu" OR "awa" OR "laau" — not articles containing all three words together. This means:
- Adding more words to a search makes it BROADER, not narrower
- Result counts for multi-word searches will be very high (thousands)
- The best searches use 1-2 highly specific terms, not longer phrases
- A search showing "Results 1 to 20 of 4,867" means you're seeing only the top 20 of 4,867 total matches

**For each search term:**

1. Run search and note results count
2. Assess noise level:
   - `low` - Most results relevant to topic (usually <50 total results)
   - `medium` - Mixed results, some relevant (50-500 results)
   - `high` - Mostly irrelevant, e.g., word disambiguation issues (>500 results)
   - `unknown` - Haven't reviewed yet
3. Mark effectiveness (did it surface relevant articles?)
4. Document intent (why did we try this term?)

**Example search log:**

| Term | Results | Noise | Effective | Notes |
|------|---------|-------|-----------|-------|
| kanu awa | 4,867 | high | no | "awa" matches harbor/channel |
| awa Puna | 20 | medium | yes | Found key 1930 article |
| ulu ka awa | 20 | medium | yes | Regional targeting helped |
| uhuki awa | 177 | medium | yes | Harvesting term disambiguates plant from harbor |
| awa ililena | 14 | low | yes | Variety name extremely targeted |
| Piper methysticum | 6 | low | yes | Scientific name bypasses ambiguity |

### Disambiguation Strategies

Many Hawaiian words have multiple meanings, which creates high noise in searches. When a key term is ambiguous (e.g., "awa" = kava plant OR harbor/channel), use these strategies to disambiguate:

**1. Harvesting/action terms that only apply to one meaning:**
- "uhuki awa" (pull out awa) — only makes sense for a plant, not a harbor
- These terms often surface enforcement/prohibition articles, which paradoxically contain rich cultivation details (documenting what was destroyed)

**2. Variety names or specialized vocabulary:**
- "awa ililena" — a named variety, can only refer to the plant
- Domain-specific terms filter out the wrong meaning entirely

**3. Scientific names:**
- "Piper methysticum" — bypasses Hawaiian ambiguity entirely
- Only finds modern articles (post-scientific-naming era)

**4. Inland region names:**
- "awa Hakipuu" — a mountain area with no harbor, so "awa" must mean the plant
- Avoid coastal regions where "awa" could mean either

**5. English terms (limited utility):**
- "awa cultivation", "kava growing" — bypasses Hawaiian ambiguity
- Only finds modern Ka Wai Ola (KWO) articles, not historical newspapers
- Useful for finding conference/festival articles but not traditional knowledge

**Counter-intuitive pattern:** Prohibition and enforcement articles (e.g., 1846-1849 awa ban) often contain the most detailed cultivation information, because enforcement required documenting garden locations, sizes, yields, and destruction methods. Searching for enforcement-related terms can surface these.

### Script Reliability Notes

- `search-kalo.js` can crash with "Execution context was destroyed" on some searches (navigation timing issue). When this happens, fall back to the screenshot from `search-newspapers.js` and manually extract article URLs from the visible results.
- `search-newspapers.js` is more reliable and should always be run first.

### Article Review

Articles can be reviewed manually or via the **triage sub-agent** (see Phase 2b below).

**For each promising article (manual review):**

1. **View article** using `view-article.js`
2. **Assign relevance tier** per brief criteria:
   - Tier 1: High value - include and prioritize
   - Tier 2: Moderate value - include
   - Tier 3: Low value - exclude (but document why)
3. **Extract findings** if Tier 1 or 2:
   - Quote directly from OCR (no inference)
   - Tag with taxonomy terms
   - Note OCR clarity
4. **Record metadata:**
   - Article ID, URL, title, date, source
   - Author (only if byline present)
   - Region mentions (only explicitly named)
   - OCR quality assessment
5. **Identify followups:**
   - Author names to search
   - Series continuations ("Aole i pau")
   - New search terms discovered
   - Gaps identified (time periods, regions, source types)

### Phase 2b: Triage Sub-Agent (Batch Article Review)

When there are many articles to review (e.g., paging through deeper results of effective searches), use the triage sub-agent to process articles in batches.

**Prompt template:** `subagents/triage-agent-prompt.md`

#### When to Use

- Reviewing deeper pages of effective searches (pages 2+ from `search-newspapers.js --page N`)
- Processing a large backlog of candidate articles from multiple searches
- Any time you have 5+ articles to triage and want to parallelize

#### How to Invoke

1. **Collect article URLs** from search result pages
2. **Filter out already-reviewed IDs** (check state file `articles[].id`)
3. **Batch into groups of 5-8 articles** (balances thoroughness with site load)
4. **Launch triage agents** using Claude Code's Task tool:
   - Read `subagents/triage-agent-prompt.md` for the full prompt structure
   - Paste the active research brief's relevance criteria and extraction taxonomy
   - Include the list of already-reviewed article IDs to skip
   - Include the batch of article URLs
5. **Run up to 2-3 agents in parallel** (respect site rate limits)
6. **Orchestrator launches merge sub-agent** for each triage result (see merge process below)
7. **Researcher reviews** the updated state at their convenience

#### Output and Merge

Each triage agent returns JSON with `triage_summary`, `articles`, `findings`, and `followups` arrays matching the state file schema. The orchestrator then launches a **merge sub-agent** (`subagents/merge-agent-prompt.md`) for each result:

```
Triage agents (parallel)     Merge agents (sequential)
┌─────────┐                  ┌─────────┐
│ Batch 1 │ ──┐              │ Merge 1 │ ── state updated ──┐
└─────────┘   │              └─────────┘                    │
┌─────────┐   ├─ all done ─▶ ┌─────────┐                    │
│ Batch 2 │ ──┤              │ Merge 2 │ ── reads latest ───┤
└─────────┘   │              └─────────┘                    │
┌─────────┐   │              ┌─────────┐                    │
│ Batch 3 │ ──┘              │ Merge 3 │ ── reads latest ───┘
└─────────┘                  └─────────┘
```

The merge agent:
1. Reads the current state file (including any prior merge's changes)
2. Deduplicates articles (skip IDs already in state)
3. Assigns sequential IDs to new findings (`f###`) and followups (`fu###`)
4. Fills `search_ids` on new articles (provided by orchestrator)
5. Deduplicates followups (skip if same `type` + `value` exists)
6. Appends new entries and updates `meta.last_session`
7. Writes the updated state file

**Why sequential merges:** Each merge agent reads the latest state file, so it sees articles/IDs added by previous merges. This prevents duplicate IDs or duplicate articles across batches. Merges are fast (no web requests, just file I/O).

See `subagents/merge-agent-prompt.md` for the full merge specification.

#### Alternative: Node.js Merge Script

In production (Session 5), the orchestrator wrote a **Node.js merge script** in the scratchpad directory instead of using sequential merge sub-agents. This approach:

- Accumulates all session data (searches, articles, findings, followups) into one atomic merge
- Is deterministic and inspectable (the script itself serves as a record)
- Handles status updates on existing followups (e.g., `fu022.status → "tried"`)
- Runs in milliseconds (no API calls or LLM reasoning needed)
- Follows the same dedup logic as the merge agent prompt (article ID match, followup type:value match)

Example pattern:
```javascript
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const existingIds = new Set(state.articles.map(a => a.id));
for (const article of newArticles) {
  if (!existingIds.has(article.id)) {
    state.articles.push(article);
    existingIds.add(article.id);
  }
}
// Sequential ID assignment for findings (f###) and followups (fu###)
// Followup dedup by type:value (first 50 chars)
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
```

Use the merge agent prompt for one-off triage batches. Use the script approach when the orchestrator is accumulating data across a full session with manual fetches, multiple triage batches, and followup status updates.

#### What the Triage Agent Does Well
- Consistent application of tier criteria across many articles
- Mechanical extraction work (fetch, read OCR, quote, tag)
- Identifying follow-up leads (authors, series, new terms)

#### What the Researcher Should Review Later
- Tier assignments on borderline articles (reasoning is in `article.reason`)
- Whether proposed `tags_extra` should become canonical tags in the brief
- Follow-up term suggestions (some may hit known noise patterns)
- Judgment calls on borderline articles (e.g., legends with incidental cultivation context)

### Anti-Inference Rules

Critical during extraction:

| Field | Rule |
|-------|------|
| `author` | Only if byline explicitly present |
| `region_mentions` | Only regions named in article text |
| `findings.quote` | Direct OCR text, no cleanup |
| `translation` | Only if article itself provides it |
| `variety names` | Quote as-is, mark unclear with [OCR unclear] |

---

## Phase 3: Save State

### Create State File

After initial session, create `research-state/{brief-name}.state.json`:

```json
{
  "meta": {
    "brief": "research-briefs/awa-cultivation-detailed.md",
    "results_file": "results/AWA_CULTIVATION_RESEARCH_RESULTS.md",
    "created": "2025-12-18",
    "last_session": "2025-12-18"
  },
  "searches": [...],
  "articles": [...],
  "findings": [...],
  "followups": [...]
}
```

### State Schema Reference

**searches:**
```json
{
  "id": "s001",
  "date": "2025-12-18",
  "term": "awa Puna",
  "filters": null,
  "results_count": 20,
  "noise": "medium",
  "effective": true,
  "intent": "target awa plant in known growing region",
  "notes": "Found key 1930 article"
}
```

**articles:**
```json
{
  "id": "KAHEEL19300814-01.2.23",
  "url": "https://www.papakilodatabase.com/pdnupepa/?a=d&d=KAHEEL19300814-01.2.23",
  "title": "He Moolelo No Ka Awa A Me Kona Wahi I Loaa Mai Ai",
  "date": "1930-08-14",
  "source": "Ke Alakai o Hawaii",
  "author": "John Maka",
  "region_mentions": ["Puna", "Halawa", "Kamaile"],
  "tier": 1,
  "reason": "Contains propagation method and variety names",
  "ocr_quality": "medium",
  "series": null,
  "raw_file": "raw-articles/KAHEEL19300814-01.2.23_2025-12-18.txt",
  "search_ids": ["s007", "s011"]
}
```

**findings:**
```json
{
  "id": "f001",
  "article_id": "KAHEEL19300814-01.2.23",
  "priority": "planting_technique",
  "tags": ["propagation"],
  "tags_extra": null,
  "quote": "poke ae no i ka lala a hoolei ilu iloko o ka lua opu awa",
  "ocr_clarity": "high",
  "note": "Propagation method: break off branch and replant in hole"
}
```

**followups:**
```json
{
  "id": "fu001",
  "type": "author",
  "value": "John Maka",
  "source_article_id": "KAHEEL19300814-01.2.23",
  "priority": "high",
  "status": "pending",
  "notes": "May have written other agricultural articles"
}
```

### Followup Types

| Type | Description | Example |
|------|-------------|---------|
| `author` | Search for other articles by this author | John Maka |
| `series` | Article continues ("Aole i pau") | next issue |
| `term` | New search term discovered | puawa |
| `newspaper` | Specific newspaper to search | Ke Alakai o Hawaii |
| `region-gap` | Region underrepresented | Maui |
| `time-gap` | Time period underrepresented | pre-1900 |
| `source-gap` | Source type underrepresented | traditional practitioner |

### Linking Searches to Articles

Use `search_ids` on articles (not `articles_surfaced` on searches):

```json
// In article:
"search_ids": ["s007", "s011"]

// NOT in search:
"articles_surfaced": ["KAHEEL19300814-01.2.23"]  // Don't do this
```

This keeps searches lightweight and avoids growing lists.

---

## Phase 4: Continue Research

### Starting a Continuation Session

1. **Read the state file** to understand current status
2. **Review followups** sorted by priority:
   ```
   high:   fu001 (author: John Maka), fu005 (source-gap: traditional practitioner)
   medium: fu002 (term: puawa), fu007 (newspaper: Ke Alakai o Hawaii)
   low:    fu006 (term: awa hiwa)
   ```
3. **Check ineffective searches** to avoid repeating:
   ```json
   "effective": false,
   "notes": "awa matches harbor/channel"
   ```
4. **Identify unexplored areas** from gaps

### Continuation Workflow

```
┌──────────────────────────────────────────────────────────┐
│ 1. Read state file                                       │
│    - What searches have been tried?                      │
│    - Which were effective vs ineffective?                │
│    - What followups are pending?                         │
├──────────────────────────────────────────────────────────┤
│ 2. Plan session                                          │
│    - Pick 2-3 high-priority followups                    │
│    - Generate new search terms from them                 │
│    - Consider time/region/source gaps                    │
├──────────────────────────────────────────────────────────┤
│ 3. Execute searches                                      │
│    - Run each search                                     │
│    - Immediately add to state with noise/effective       │
│    - Link any new articles found                         │
├──────────────────────────────────────────────────────────┤
│ 4. Review new articles                                   │
│    - Assign tiers per brief criteria                     │
│    - Extract findings from Tier 1/2                      │
│    - Add to state                                        │
│    (Or use triage sub-agent for batch review — Phase 2b) │
├──────────────────────────────────────────────────────────┤
│ 5. Update followups                                      │
│    - Mark completed followups as "completed"             │
│    - Add new followups discovered                        │
│    - Adjust priorities based on findings                 │
├──────────────────────────────────────────────────────────┤
│ 6. Update state file                                     │
│    - Add all new searches, articles, findings, followups │
│    - Update meta.last_session                            │
│    - Save                                                │
├──────────────────────────────────────────────────────────┤
│ 7. Update results file (optional)                        │
│    - Add significant new findings                        │
│    - Update summary if picture changed                   │
└──────────────────────────────────────────────────────────┘
```

### Example: Continuing Awa Research

**Starting state:**
- 12 searches (3 effective)
- 14 articles (1 Tier 1, 1 Tier 2)
- 8 followups pending

**Session plan:**
1. Search for author "John Maka" (fu001, high priority)
2. Try term "puawa" (fu002, medium priority)
3. Search newspaper "Ke Alakai o Hawaii" for agricultural content (fu007)

**After session:**
- Update followups:
  - fu001: status → "completed" or "tried" (depending on results)
- Add new searches with results
- Add any new articles found
- Extract findings from relevant articles
- Add new followups discovered
- Update `last_session` date

---

## Phase 5: Update Results

### When to Update Results File

- After finding new Tier 1 articles
- When overall picture of findings changes
- At natural stopping points (end of session, topic exhausted)

### Results File Structure

```markdown
# {Topic} Research Results

**Research Brief:** `research-briefs/{brief}.md`
**Date:** {date}
**Search Terms Used:** {effective terms}

## Summary
{High-level findings}

## Key Findings
{Organized by theme or time period}

## Article Details
### Tier 1 - HIGH VALUE
{Detailed summaries with URLs, raw file refs, key quotes}

### Tier 2 - MODERATE VALUE
{Briefer summaries}

## Search Strategy Results
{What worked, what didn't, recommendations}

## Bias Observations
{Source type, time period, regional coverage notes}

## Recommendations for Further Research
{Based on followups and gaps}
```

---

## File Organization

```
papak-agent-playw-1/
├── research-briefs/
│   ├── awa-cultivation-detailed.md      # Brief definition
│   └── ...
├── research-state/
│   ├── awa-cultivation-detailed.state.json  # Session state
│   └── ...
├── results/
│   ├── AWA_CULTIVATION_RESEARCH_RESULTS.md  # Human-readable findings
│   └── ...
├── raw-articles/
│   ├── KAHEEL19300814-01.2.23_2025-12-18.txt  # OCR text backup
│   └── ...
├── subagents/
│   ├── triage-agent-prompt.md           # Batch article triage agent
│   └── merge-agent-prompt.md            # State file merge agent
└── source-pdfs/
    └── ...  # Original scans when needed
```

---

## Quick Reference

### Noise Levels
- `low` - Mostly relevant results
- `medium` - Mixed, some relevant
- `high` - Mostly noise (disambiguation issues, etc.)
- `unknown` - Not yet assessed

### Tier Definitions
- **Tier 1** - High value: directly addresses query with substantial info
- **Tier 2** - Moderate: relevant but not primary focus, or limited info
- **Tier 3** - Low value: peripheral mention, exclude from results

### Followup Priorities
- `high` - Do first in next session
- `medium` - Do if time permits
- `low` - Backlog for later

### Followup Status
- `pending` - Not yet attempted
- `tried` - Attempted, inconclusive
- `completed` - Resolved (found relevant content or confirmed dead end)
- `blocked` - Cannot proceed (technical issue, etc.)

### OCR Clarity
- `high` - Text clearly readable
- `medium` - Some garbled sections but main content extractable
- `low` - Significant portions unreadable, may need PDF verification

---

## Sub-Agent Parallelization

*Developed from awa research sessions (5 sessions, 68 searches, 2 Tier 1 / 15 Tier 2 results). These principles apply to any research brief.*

### What's Implemented

| Capability | Status | Location |
|-----------|--------|----------|
| Search pagination | Done | `search-newspapers.js --page N` |
| Triage sub-agent prompt | Done | `subagents/triage-agent-prompt.md` |
| Merge sub-agent prompt | Done | `subagents/merge-agent-prompt.md` |
| Parallel agent execution | Available | Claude Code Task tool (2-3 concurrent agents) |

### Bottleneck Analysis

#### 1. Search Breadth — SOLVED

`search-newspapers.js --page N` accesses deeper results. Effective searches with 100+ results can now be fully reviewed by paging through and sending batches to triage agents.

#### 2. Article Triage — IMPLEMENTED

The triage sub-agent (`subagents/triage-agent-prompt.md`) fetches articles, applies brief criteria, extracts findings, and returns structured JSON. See Phase 2b in the workflow above for usage details.

**Tested:** 3 known articles for validation (1 Tier 1, 1 Tier 2, 1 Tier 3) — agent matched expected tier assignments on all three. Findings extraction aligned with manual results. **Production-tested** in Session 5: 7 triage batches (~40 articles total), all tier assignments confirmed accurate on review.

**Parallelization:** Up to 2-3 triage agents can run concurrently on different article batches. Limit concurrency to respect the Papakilo site (each agent runs headless Chrome via `view-article.js`).

#### 3. Search Term Generation — Not Automated

The creative/strategic decisions about *what to search for* benefit more from researcher judgment than automation. Once disambiguation strategies for a topic are identified, generating more terms is diminishing returns.

### Architecture Principles

**Automated (sub-agents, researcher reviews later):**
- Batch article triage: triage sub-agents fetch, tier-assess, and extract findings (parallel)
- State file merge: merge sub-agents incorporate triage results (sequential)
- Paging through effective searches to collect candidate article URLs

**Not automated:**
- The decision of which search terms to try — this requires domain knowledge and counter-intuitive reasoning (e.g., prohibition enforcement articles being the richest source of cultivation data)
- Final tier adjustments — the sub-agent's assessments may need researcher correction on borderline cases
- Promoting `tags_extra` to canonical taxonomy tags in the brief

### Why Not Full Autonomy

A fully autonomous "run searches and update state" agent would miss the kinds of insights that come from a researcher in the loop. Examples from the awa research:

- The prohibition era (1846-1849) being the richest source of cultivation data is counter-intuitive — enforcement articles document garden sizes, locations, yields, and destruction methods precisely because the government needed to record what it was destroying
- Recognizing that "uhuki awa" (pulling out awa) disambiguates the plant from the harbor meaning, because you only pull out a plant — this kind of semantic reasoning about Hawaiian word senses is subtle
- Deciding that a legend about a chief's guarded awa garden (Tier 2) provides legitimate cultivation context even though it's fictional — this requires judgment about what counts as "cultivation information"

The sub-agent approach works best as a **triage accelerator**: let the agent do the mechanical work of fetching and initial assessment, then let the researcher make the final calls.

### Future Ideas (Not Yet Implemented)

- **Cross-reference agent** — reads all saved raw articles and identifies patterns: recurring author names, series references ("Aole i pau"), vocabulary that suggests new search terms. Returns a prioritized list of follow-up leads.

---

## Operational Lessons (Session 5)

### Mixed Manual + Agent Approach

The most effective workflow combines manual article checks with parallel triage agents:

1. Launch triage agents on batches of 5-8 articles
2. While agents run, manually fetch and quick-check individual articles (e.g., following up a specific author lead or checking a single promising result)
3. Collect all results (agent + manual) at the end of the session
4. Merge everything into state via a single merge script

This keeps the researcher productive during agent wait times and allows faster iteration on targeted leads.

### Auto-Compaction and Subagent Status

Long research sessions with many parallel agents may trigger Claude Code's auto-compaction (context window management). When this happens:

- **Subagent status bars may show "(running)" even after completion.** This is a display lag. Check actual status via `TaskOutput` with `block: false`.
- **Task completion notifications still arrive correctly** (as `<task-notification>` messages).
- **All task outputs are preserved** in the tasks output directory regardless of compaction.

### Agricultural Society Reports Finding

Searching for "Ahahui Mahiai" (Agricultural Society) reports was a productive strategy, but the finding was largely negative: **9 of 10 district reports had zero awa content.** These societies focused on cash crops (tobacco, cotton, rice, coffee). Only the North Kona society mentioned awa. This negative finding is itself valuable — it confirms awa was not part of the formal agricultural modernization movement and likely remained in oral/informal knowledge channels.

### Diminishing Returns Pattern

After 68 searches across 5 sessions:
- Sessions 1-2 (29 searches): Found both Tier 1 articles and most Tier 2 articles
- Sessions 3-5 (39 searches): Found 2 more Tier 2 articles but no new Tier 1
- The OR-matching search engine makes disambiguation progressively harder as obvious terms are exhausted
- Remaining high-value leads require non-search approaches (PDF downloads for garbled OCR, following specific committee meeting trails in specific newspapers)
