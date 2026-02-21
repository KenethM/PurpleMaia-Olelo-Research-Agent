# Research Improvement Plan

## Expert Feedback Received (December 2024)

Feedback from Hawaiian cultural researchers and farmers on initial KALO_RESEARCH_RESULTS.md:

### Issues Identified

1. **Hallucination in summaries** - Article 2's taro variety list was fabricated rather than extracted from source. The article does list variety names but the AI summary did not accurately pull them.

2. **Weak relevance filtering** - Article 5 included despite only briefly mentioning kalo. It discusses crops grown in Hāmākua but doesn't address planting or cultivation methods.

3. **Time period bias** - All results from 1900s, missing 1800s materials. Possible explanations:
   - Model/search bias
   - Prompt needs adjustment
   - Historical context: 1900s saw kalo production decline, prompting more explicit documentation vs 1800s when practices were common knowledge

4. **Institutional source bias** - Results favor government-affiliated authors over traditional knowledge sources. Traditional knowledge is usually what researchers seek from nupepa.

### Request for Further Testing
- More detailed queries: specific areas, specific topics like soil fertility for kalo

---

## Root Cause Analysis

### Hallucination Problem
- Worked from noisy OCR text
- Likely "filled in" variety names from general knowledge rather than strictly extracting what was present
- Serious accuracy issue that undermines research utility

### Relevance Problem
- No clear threshold for inclusion
- Included articles that mentioned kalo rather than requiring they address the actual query (cultivation methods)

### Time Period Bias
Possible causes:
- Search result ordering on Papakilo (recency? relevance scoring?)
- Selection favoring more "readable" articles (1900s OCR may be cleaner)
- Actual corpus distribution (1900s decline hypothesis)

### Institutional Bias
Possible causes:
- Government/institutional articles may be more "structured" and rank higher
- Traditional knowledge may appear in more narrative forms that got filtered out
- Different newspapers had different editorial perspectives

---

## Action Plan

### Phase 1: Correct Existing Results [COMPLETED]
- [x] Re-read Article 2 and accurately extract the actual variety names from OCR
- [x] Downgrade or remove Article 5 with note about limited relevance
- [x] Add confidence markers and direct quotes to summaries
- [x] Update KALO_RESEARCH_RESULTS.md with corrections

**Changes made:**
- Article 2: Removed hallucinated variety list; noted only "Huli-Pake" is clearly readable
- Article 5: Marked as EXCLUDED with explanation of why it doesn't meet relevance criteria
- Added "Observed Biases and Limitations" section documenting time period and source type bias

**Process improvements implemented:**
- `view-article.js` now saves raw OCR to `raw-articles/` for verification
- `CLAUDE.md` updated with strict extraction rules and relevance tiers

### Phase 2: Investigate Time Period Distribution
- [ ] Search specifically for 1800s articles
- [ ] Try date-based search terms if possible (e.g., newspaper codes from 1860s-1890s)
- [ ] Document what's actually available by decade
- [ ] Note if 1800s articles have different character (more assumed knowledge?)

### Phase 3: Improve Source Diversity
- [ ] Look for articles by named Hawaiian practitioners (not government affiliates)
- [ ] Try different newspaper sources beyond Ka Nupepa Kuokoa
- [ ] Search for narrative/mo'olelo style articles about kalo traditions
- [ ] Look for articles from specific regions known for kalo cultivation

### Phase 4: Test Detailed Queries (Per Researcher Request)
- [ ] Soil fertility: "lepo momona kalo", "lepo maikai", "momona aina"
- [ ] Area-specific: "kalo Waipio", "kalo Hamakua", "kalo Hanalei"
- [ ] Specific practices: "wai kalo" (water management), "kalo malo'o" (dryland)
- [ ] Traditional knowledge terms: "loina kalo", "ao kalo" (kalo teachings)

### Phase 5: Process Improvements [COMPLETED]
- [x] Create stricter extraction rules (quote directly from source, note OCR uncertainty)
- [x] Define relevance tiers (now query-specific via Research Brief system)
- [x] Document observed biases transparently in results
- [x] Add confidence levels to all summaries

**Approach taken:** Instead of hardcoding relevance criteria, implemented a **Research Brief system** that allows different criteria for different research types.

**Files created:**
- `RESEARCH_BRIEF_PROCESS.md` - Documents the process for creating new briefs
- `research-briefs/_template.md` - Blank template
- `research-briefs/cultural-practices.md` - For traditional methods research (e.g., kalo)
- `research-briefs/genealogy.md` - For family/people research

**CLAUDE.md updates:**
- Added Research Briefs section explaining the system
- Updated workflow to start with brief selection (Step 0)
- Updated reporting to include which brief was used

---

## New Search Strategies to Try

### For Traditional Knowledge Sources
```
# Terms that might surface practitioner voices
"ka hana a na kupuna" (the work of the ancestors)
"ma ka wa kahiko" (in ancient times)
"loina kahiko" (ancient practices)
```

### For 1800s Coverage
```
# Search within specific historical newspapers
# Check if Papakilo allows date filtering
# Look for series articles that may span years
```

### For Regional Specificity
```
# Known kalo regions to search
Waipio, Hanalei, Keanae, Wailua, Halawa
# Combined with cultivation terms
"kalo Waipio", "mahi ai Hanalei"
```

---

## Success Metrics

After implementing improvements:
1. Zero hallucinated content - all variety names, practices verified against source
2. Clear relevance justification for each included article
3. Time period distribution documented and explained
4. Mix of institutional and traditional knowledge sources
5. Specific queries return focused, relevant results

---

## Notes

- OCR quality varies by newspaper and era - document when uncertain
- Hawaiian diacriticals often missing - search with and without
- "(Aole i pau)" indicates article continues - follow series when relevant
- Researchers value persistent URLs for verification
