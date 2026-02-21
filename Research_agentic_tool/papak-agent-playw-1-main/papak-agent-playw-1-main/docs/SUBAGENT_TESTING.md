# Sub-Agent Testing

Verification results for the triage and merge sub-agents. Run these tests after modifying prompt templates to confirm correct behavior.

## Test Strategy

Use articles with **known expected tiers** from previous manual review. Include a mix of:
- An article already in the state file (tests deduplication)
- Articles not in the state file across multiple tiers (tests triage accuracy and merge correctness)

## Test 1: Triage Agent Accuracy (2026-01-29)

**Prompt template:** `subagents/triage-agent-prompt.md`
**Brief:** `research-briefs/awa-cultivation-detailed.md`

### Test Articles

| Article ID | Expected Tier | Known Content |
|-----------|--------------|---------------|
| `KAHEEL19300814-01.2.23` | Tier 1 | John Maka awa cultivation article (propagation, varieties, regions) |
| `KE18461021-01.2.4` | Tier 2 | 1846 awa prohibition law (garden sizes, regulation) |
| `KE18460723-01.2.4` | Tier 3 | Prohibition enforcement in Kalihi (no cultivation methods) |

### Results

| Article ID | Agent Tier | Expected | Match? |
|-----------|-----------|----------|--------|
| `KAHEEL19300814-01.2.23` | Tier 1 | Tier 1 | Yes |
| `KE18461021-01.2.4` | Tier 2 | Tier 2 | Yes |
| `KE18460723-01.2.4` | Tier 3 | Tier 3 | Yes |

**Tier accuracy: 3/3 (100%)**

### Findings Quality

- **Tier 1 (John Maka):** Agent extracted propagation method, variety names (Papa, Alikea, Mokihana), regional info (Kamaile, Halawa, Hakipuu). Aligned with manual findings f001-f005 in state file. Correctly noted low OCR quality and flagged original scan for review.
- **Tier 2 (1846 law):** Extracted legal framework details — one mala per island, 6-acre max, kahuna licensing. Matched manual finding f008.
- **Tier 3 (Kalihi enforcement):** Correctly excluded with clear reasoning referencing actual content.

### Follow-ups Quality

Agent proposed 5 follow-ups. "John Maka" author and "kanawai awa" term matched existing state entries. "Original scan PDF" was a useful new suggestion. "mala awa eka" was a term that would hit known OR-matching noise — this kind of filtering is why human review of follow-ups matters.

### Notes

- Agent rated John Maka article OCR as "low" where manual review said "medium" — reasonable disagreement, the OCR is genuinely rough in that article.
- Anti-inference rules followed correctly: author only listed when byline present, regions only from text, OCR quoted as-is.

---

## Test 2: Full Pipeline — Triage + Merge (2026-01-29)

**Prompt templates:** `subagents/triage-agent-prompt.md`, `subagents/merge-agent-prompt.md`
**Brief:** `research-briefs/awa-cultivation-detailed.md`
**State file:** Copy of `research-state/awa-cultivation-detailed.state.json` (19 articles, max f015, max fu012)

### Test Articles

| Article ID | In State? | Expected Tier | Purpose |
|-----------|----------|--------------|---------|
| `KAHEEL19300814-01.2.23` | Yes | Tier 1 | Tests deduplication |
| `KNK18920514-01.2.6` | No | Tier 3 | Ceremony article, tests new Tier 3 add |
| `KHPA18831013-01.2.5` | No | Tier 3 | Harbor news, tests new Tier 3 add |

### Triage Results

| Article ID | Agent Tier | Correct? | Notes |
|-----------|-----------|----------|-------|
| `KAHEEL19300814-01.2.23` | Tier 1 | Yes | Propagation, varieties, regions |
| `KNK18920514-01.2.6` | Tier 3 | Yes | Awa as ceremonial offering only |
| `KHPA18831013-01.2.5` | Tier 3 | Yes | "awa" = harbor (awa kumoku), not plant |

### Merge Verification

| Check | Expected | Actual | Pass? |
|-------|----------|--------|-------|
| `meta.last_session` | `2026-01-29` | `2026-01-29` | Yes |
| Articles count | 19 → 21 (2 new Tier 3) | 21 | Yes |
| New articles `search_ids` | `["s014"]` | `["s014"]` | Yes |
| Duplicate article unchanged | `search_ids: ["s007","s011"]`, `ocr_quality: medium` | Unchanged | Yes |
| Findings count | 15 (unchanged — all findings were for dup article) | 15 | Yes |
| Max finding ID | `f015` (no new findings added) | `f015` | Yes |
| Followups count | 12 → 13 (1 new, 3 skipped as dups) | 13 | Yes |
| New followup `fu013` | series type, pending status | `series: He Moolelo No Ka Awa — possible continuation`, `pending` | Yes |

### Deduplication Details

**Articles:**
- `KAHEEL19300814-01.2.23` — skipped (already in state). Original entry preserved with `search_ids: ["s007","s011"]` and `ocr_quality: medium` (triage agent had said "low" — existing entry was NOT overwritten).

**Findings:**
- All 3 triage findings were for `KAHEEL19300814-01.2.23` — skipped because parent article was deduplicated. Existing findings f001-f005 preserved.

**Followups:**
- `author:John Maka` — skipped (matches fu001)
- `term:puawa` — skipped (matches fu002)
- `newspaper:Ke Alakai o Hawaii (1930s)` — skipped (matches fu007 despite slightly different value text — agent correctly recognized the match)
- `series:He Moolelo No Ka Awa — possible continuation` — added as fu013 (genuinely new)

### Key Observations

1. **Dedup preserves originals.** The merge agent did not overwrite the existing article's fields (which differed from the triage agent's output on `ocr_quality` and `region_mentions` formatting). This is correct behavior.
2. **Findings skipped with dup parent.** Since the Tier 1 article was a duplicate, none of its findings were re-added. This avoids duplicate findings in the state file.
3. **Fuzzy followup matching.** The agent matched `Ke Alakai o Hawaii (1930s)` to existing `Ke Alakai o Hawaii` despite different value strings. This is a judgment call — acceptable but worth noting that exact string matching would have added a duplicate.
4. **Sequential IDs correct.** New followup got `fu013`, continuing from existing max `fu012`.

---

## Production Run: Session 5 (2026-01-29)

### Overview

First real-world production run of the subagent system across a full research session.

- **7 triage batches** launched (batches 1-7)
- **~40 articles** triaged total
- **Up to 3 agents in parallel** at peak
- **Merge via Node.js script** (not merge sub-agent) — see RESEARCH_WORKFLOW.md

### Triage Results by Batch

| Batch | Articles | T1 | T2 | T3 | Notes |
|-------|----------|----|----|----|----|
| 1: Prohibition/law | 5 | 0 | 2 | 3 | Found 1856 legalization law, 1871 advocacy |
| 2: Historical/cultural | 7 | 1 | 1 | 5 | Found Kamakau 1869 (Tier 1!), 1871 editorial |
| 3: Hakipuu/mixed | 5 | 0 | 2 | 3 | Found Hamakua census, Halawai Kona |
| 4: Puna awa | 5 | 0 | 1 | 3+1err | Found Hamakua census (dup); 2 garbled OCR |
| 5: Secondary candidates | 5 | 0 | 0 | 5 | All Tier 3: ads, farming general, license auctions |
| 6: Hawaii/Kauai ag reports | 5 | 0 | 0 | 5 | All Tier 3: no awa in any ag society report |
| 7: Maui/Oahu ag reports | 5 | 0 | 1 | 4 | Found Kona Akau awa committee (Tier 2) |
| **Total** | **37** | **1** | **7** | **28+1** | |

### Tier Accuracy

All tier assignments were reviewed by the orchestrator and confirmed accurate. No tier reassignments needed. Borderline cases (legends with incidental awa content) were correctly assigned Tier 2 with appropriate reasoning.

### Key Observations

1. **Triage quality was high.** Anti-inference rules followed consistently. Quotes directly from OCR, no hallucinated content, clear tier reasoning.
2. **Batches 5-7 had low yield** (ag society reports). The hypothesis that other district reports would contain awa data like Hamakua's was tested and mostly disproven — a valid negative result.
3. **Merge script preferred over merge agent.** For a full session with manual fetches + agent batches + followup status updates, a single merge script was simpler than sequential merge agents.
4. **Auto-compaction caused display lag.** Status bars showed agents as "(running)" after completion. `TaskOutput` confirmed actual completion. No data loss.
5. **Triage agents handle garbled OCR well.** Two completely unreadable articles were correctly assigned Tier 3 with "OCR too garbled" reasoning and appropriate PDF download followups suggested.

---

## Running These Tests

To re-run after modifying sub-agent prompts:

1. Copy the real state file to scratchpad:
   ```bash
   cp research-state/awa-cultivation-detailed.state.json /tmp/test-state.json
   ```

2. Launch triage agent with known test articles (include mix of existing + new, multiple tiers)

3. Launch merge agent pointing at the test state file

4. Verify with:
   ```javascript
   node -e "
   const state = require('/tmp/test-state.json');
   console.log('Articles:', state.articles.length);
   console.log('Findings:', state.findings.length);
   console.log('Followups:', state.followups.length);
   console.log('last_session:', state.meta.last_session);
   // Check specific expectations...
   "
   ```
