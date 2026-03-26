# Research Workflow Guide

This document describes the end-to-end process for conducting research using the CTAHR document collection, from defining a research brief through continuation across multiple sessions.

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
│ Search with   │     │ Batch documents  │     │ Triage agents│     │ Human review │
│ multiple      │ ──▶ │ into groups of   │ ──▶ │ run in       │ ──▶ │ + merge into │
│ terms         │     │ 5-8              │     │ parallel     │     │ state        │
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
2. **Identify a model brief** to adapt (e.g., `ctahr-general.md` for broad research)
3. **Define the research goal** with the researcher through natural language discussion
4. **Extract key parameters:**
   - What makes a document highly relevant vs moderately relevant vs excludable?
   - What information should be extracted first? (priority order)
   - What sources/collections are preferred?
   - What biases should we watch for?

### Extraction Taxonomy

Define 6-12 theme-based tags in the brief:

```markdown
## Extraction Taxonomy

| Tag | Description |
|-----|-------------|
| `method` | Research methods, techniques, procedures |
| `results` | Data, findings, measurements |
| `recommendation` | Practical advice, best practices |
| `species` | Specific organisms discussed |
| `region` | Geographic locations mentioned |
```

**Rules:**
- Theme tags only (not metadata like `collection` — use `collection` in state)
- Keep stable across sessions
- Use `tags_extra` in state file for proposed additions

---

## Phase 2: Initial Search Session

### Setup

1. Confirm the brief file is saved to `research-briefs/`
2. Review the Search Strategy section for initial terms
3. Ensure index is up to date:
   - `node index-docs.js` — build/update index
   - `node search-docs.js --stats` — verify document count

### Search Execution

**For each search term:**

1. Run search and note results count
2. Assess noise level:
   - `low` — Most results relevant to topic
   - `medium` — Mixed results, some relevant
   - `high` — Mostly irrelevant (ambiguous terms, etc.)
   - `unknown` — Haven't reviewed yet
3. Mark effectiveness (did it surface relevant documents?)
4. Document intent (why did we try this term?)

**Example search log:**

| Term | Results | Noise | Effective | Notes |
|------|---------|-------|-----------|-------|
| soil conservation | 15 | low | yes | Core topic, good results |
| erosion | 8 | medium | yes | Some about water erosion, not soil |
| mulch | 22 | medium | yes | Mixed with ornamental mulch docs |
| andisol | 3 | low | yes | Very specific soil type, all relevant |

### Document Review

Documents can be reviewed manually or via the **triage sub-agent** (see Phase 2b below).

**For each promising document (manual review):**

1. **View document** using `view-doc.js`
2. **Assign relevance tier** per brief criteria:
   - Tier 1: High value — include and prioritize
   - Tier 2: Moderate value — include
   - Tier 3: Low value — exclude (but document why)
3. **Extract findings** if Tier 1 or 2:
   - Quote directly from extracted text (no inference)
   - Tag with taxonomy terms
   - Note text clarity
4. **Record metadata:**
   - Document ID, path, title, collection, file type
   - Author (only if explicitly stated)
   - Text quality assessment
5. **Identify followups:**
   - Author names to search
   - Related documents or series
   - New search terms discovered
   - Gaps identified (collections, topics, document types)

### Phase 2b: Triage Sub-Agent (Batch Document Review)

When there are many documents to review, use the triage sub-agent to process them in batches.

**Prompt template:** `subagents/triage-agent-prompt.md`

#### When to Use

- Processing results from multiple effective searches
- Any time you have 5+ documents to triage and want to parallelize

#### How to Invoke

1. **Collect document paths/IDs** from search results
2. **Filter out already-reviewed IDs** (check state file `documents[].id`)
3. **Batch into groups of 5-8 documents**
4. **Launch triage agents** using Claude Code's Agent tool:
   - Read `subagents/triage-agent-prompt.md` for the full prompt structure
   - Paste the active research brief's relevance criteria and extraction taxonomy
   - Include the list of already-reviewed document IDs to skip
   - Include the batch of document paths
5. **Run agents in parallel** (no external rate limits — limited only by local CPU)
6. **Orchestrator launches merge sub-agent** for each triage result

#### Output and Merge

Each triage agent returns JSON with `triage_summary`, `documents`, `findings`, and `followups` arrays matching the state file schema. The orchestrator then launches a **merge sub-agent** (`subagents/merge-agent-prompt.md`) for each result:

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

**Why sequential merges:** Each merge agent reads the latest state file, so it sees documents/IDs added by previous merges. This prevents duplicate IDs or duplicate documents across batches.

See `subagents/merge-agent-prompt.md` for the full merge specification.

#### Alternative: Node.js Merge Script

For full sessions with mixed manual + agent data, the orchestrator can write a **Node.js merge script** instead of using sequential merge sub-agents. This approach:

- Accumulates all session data (searches, documents, findings, followups) into one atomic merge
- Is deterministic and inspectable (the script itself serves as a record)
- Handles status updates on existing followups
- Runs in milliseconds (no API calls or LLM reasoning needed)

Example pattern:
```javascript
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const existingIds = new Set(state.documents.map(d => d.id));
for (const doc of newDocuments) {
  if (!existingIds.has(doc.id)) {
    state.documents.push(doc);
    existingIds.add(doc.id);
  }
}
// Sequential ID assignment for findings (f###) and followups (fu###)
// Followup dedup by type:value
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
```

### Anti-Inference Rules

Critical during extraction:

| Field | Rule |
|-------|------|
| `author` | Only if explicitly stated in the document |
| `findings.quote` | Direct extracted text, no cleanup |
| Data/names | Quote as-is, mark unclear with [unclear] |

---

## Phase 3: Save State

### Create State File

After initial session, create `research-state/{brief-name}.state.json`:

```json
{
  "meta": {
    "brief": "research-briefs/ctahr-general.md",
    "results_file": "results/CTAHR_RESEARCH_RESULTS.md",
    "created": "2026-03-19",
    "last_session": "2026-03-19"
  },
  "searches": [...],
  "documents": [...],
  "findings": [...],
  "followups": [...]
}
```

### State Schema Reference

**searches:**
```json
{
  "id": "s001",
  "date": "2026-03-19",
  "term": "soil conservation",
  "filters": null,
  "results_count": 15,
  "noise": "low",
  "effective": true,
  "intent": "find core soil conservation documents",
  "notes": "Good results, mostly relevant"
}
```

**documents:**
```json
{
  "id": "smarts2/bsipes",
  "path": "ctahr-pdfs/SMARTS2/bsipes.pdf",
  "title": "Soil Conservation in Hawaiian Agriculture",
  "collection": "SMARTS2",
  "file_type": "pdf",
  "pages": 12,
  "author": "B. Sipes",
  "tier": 1,
  "reason": "Detailed soil conservation methods specific to Hawaii",
  "text_quality": "good",
  "series": null,
  "text_file": "extracted-text/smarts2_bsipes_2026-03-19.txt",
  "search_ids": ["s001"]
}
```

**findings:**
```json
{
  "id": "f001",
  "document_id": "smarts2/bsipes",
  "priority": "method",
  "tags": ["method"],
  "tags_extra": null,
  "quote": "Cover cropping with sunn hemp reduced erosion by 60% on volcanic slopes",
  "text_clarity": "high",
  "note": "Quantified erosion reduction from cover cropping"
}
```

**followups:**
```json
{
  "id": "fu001",
  "type": "author",
  "value": "B. Sipes",
  "source_document_id": "smarts2/bsipes",
  "priority": "high",
  "status": "pending",
  "notes": "May have other soil science publications in the collection"
}
```

### Followup Types

| Type | Description | Example |
|------|-------------|---------|
| `author` | Search for other documents by this author | B. Sipes |
| `series` | Related or continuation document | Part 2 of a guide |
| `term` | New search term discovered | sunn hemp |
| `collection` | Specific collection to search | VetExt folder |
| `topic-gap` | Topic area underrepresented | irrigation methods |
| `time-gap` | Time period underrepresented | pre-2010 documents |
| `source-gap` | Source type underrepresented | extension guides |

### Linking Searches to Documents

Use `search_ids` on documents (not `documents_surfaced` on searches):

```json
// In document:
"search_ids": ["s001", "s003"]

// NOT in search:
"documents_surfaced": ["smarts2/bsipes"]  // Don't do this
```

This keeps searches lightweight and avoids growing lists.

---

## Phase 4: Continue Research

### Starting a Continuation Session

1. **Read the state file** to understand current status
2. **Review followups** sorted by priority
3. **Check ineffective searches** to avoid repeating
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
│    - Consider topic/collection/source gaps               │
├──────────────────────────────────────────────────────────┤
│ 3. Execute searches                                      │
│    - Run each search                                     │
│    - Immediately add to state with noise/effective       │
│    - Link any new documents found                        │
├──────────────────────────────────────────────────────────┤
│ 4. Review new documents                                  │
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
│    - Add all new searches, documents, findings, followups│
│    - Update meta.last_session                            │
│    - Save                                                │
├──────────────────────────────────────────────────────────┤
│ 7. Update results file (optional)                        │
│    - Add significant new findings                        │
│    - Update summary if picture changed                   │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 5: Update Results

### When to Update Results File

- After finding new Tier 1 documents
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
{Organized by theme or extraction priority}

## Document Details
### Tier 1 - HIGH VALUE
{Detailed summaries with paths, IDs, key quotes}

### Tier 2 - MODERATE VALUE
{Briefer summaries}

## Search Strategy Results
{What worked, what didn't, recommendations}

## Bias Observations
{Collection, document type, coverage notes}

## Recommendations for Further Research
{Based on followups and gaps}
```

---

## File Organization

```
ctahr-doc-research/
├── research-briefs/
│   ├── ctahr-general.md              # Brief definition
│   └── ...
├── research-state/
│   ├── ctahr-general.state.json      # Session state
│   └── ...
├── results/
│   ├── CTAHR_RESEARCH_RESULTS.md     # Human-readable findings
│   └── ...
├── extracted-text/
│   ├── smarts2_bsipes_2026-03-19.txt # Extracted text backup
│   └── ...
├── subagents/
│   ├── triage-agent-prompt.md        # Batch document triage agent
│   └── merge-agent-prompt.md         # State file merge agent
└── ctahr-pdfs/
    └── ...  # Source documents
```

---

## Quick Reference

### Noise Levels
- `low` — Mostly relevant results
- `medium` — Mixed, some relevant
- `high` — Mostly noise
- `unknown` — Not yet assessed

### Tier Definitions
- **Tier 1** — High value: directly addresses query with substantial info
- **Tier 2** — Moderate: relevant but not primary focus, or limited info
- **Tier 3** — Low value: peripheral mention, exclude from results

### Followup Priorities
- `high` — Do first in next session
- `medium` — Do if time permits
- `low` — Backlog for later

### Followup Status
- `pending` — Not yet attempted
- `tried` — Attempted, inconclusive
- `completed` — Resolved
- `blocked` — Cannot proceed

### Text Clarity
- `high` — Text clearly extracted and readable
- `medium` — Some sections poorly extracted but main content readable
- `low` — Significant portions garbled, may need visual review with Read tool
