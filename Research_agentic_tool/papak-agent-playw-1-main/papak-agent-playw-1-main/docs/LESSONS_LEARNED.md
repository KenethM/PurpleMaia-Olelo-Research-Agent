# Lessons Learned: Papakilo Database + Playwright + AI Agent

## Overview

This document captures technical and workflow learnings from the initial prototype testing through the first real research query (kalo cultivation articles).

---

## Technical Discoveries

### Site Architecture

#### Main Papakilo Search (sourcesearch.php)
- **URL Pattern:** `https://www.papakilodatabase.com/main/sourcesearch.php#q:QUERY|r:PAGE|o:OFFSET`
- **Routing:** Hash-based (client-side JavaScript)
- **Search Input:** `#specialsearch_term`
- **Submit Button:** `#search_button`
- **Challenge:** Results load dynamically, requires longer wait times
- **Status:** Had difficulty getting results to load reliably

#### Hawaiian Newspapers Collection (pdnupepa)
- **Home URL:** `https://www.papakilodatabase.com/pdnupepa/cgi-bin/pdnupepa?a=p&p=home`
- **Search Input:** `#homepagesearchinputtxq` (name: `txq`)
- **Search Results URL Pattern:**
  ```
  /pdnupepa/?a=q&hs=1&r=1&results=1&txf=txIN|txNU|txTR|txTI&txq=SEARCH_TERM&e=...
  ```
- **Article URL Pattern:**
  ```
  /pdnupepa/?a=d&d=NEWSPAPER_CODE_DATE-ISSUE.SECTION.ARTICLE
  ```
  Example: `d=KNK19220421-01.2.14` = Ka Nupepa Kuokoa, April 21, 1922, Issue 01, Section 2, Article 14
- **Status:** More reliable for searching and viewing articles

### Newspaper Codes Discovered
| Code | Newspaper Name |
|------|----------------|
| KNK | Ka Nupepa Kuokoa |
| KHHA | Ka Hoku o Hawaii |
| KAA | Ke Aloha Aina |
| KHR | Kuokoa Home Rula |
| KWO | Ka Wai Ola (modern) |
| PLK | (Unknown - needs investigation) |

### Page Load Strategies

#### What Didn't Work Well
```javascript
// Too strict - often timed out
await page.waitForLoadState('networkidle');
```

#### What Worked Better
```javascript
// More forgiving approach
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(4000); // Fixed delay for JS rendering
```

### Text Extraction Approaches

#### Challenge
- Article text is displayed in a specific panel
- Page has lots of navigation/chrome text
- OCR text has significant errors

#### Working Approach
```javascript
const allText = await page.evaluate(() => document.body.innerText);
// Then filter out navigation elements
```

#### Better Approach (needs refinement)
```javascript
// Target specific content areas
const textSection = document.querySelector('.documentdisplayleftpanetabareacontentpadding');
```

---

## Workflow Learnings

### Effective Search Strategy

1. **Start broad, then narrow**
   - Initial search: "kanu kalo" (2,294 results)
   - Refined: "Na Loina Kanu Kalo" (126 results)
   - Specific: "kuhikuhi kalo" (fewer, more targeted)

2. **Use multiple Hawaiian terms for same concept**
   - kanu = plant
   - mahi = cultivate/farm
   - hooulu = grow/cultivate
   - loina = tradition/practice
   - kuhikuhi = instructions/guidelines

3. **Combine topic + region for targeted results**
   - "kalo Waipio" (617 results)
   - "Hamakua kalo mahi" (313 results)

### Article Evaluation

#### Indicators of Good Agricultural Content
- Title contains: kanu, mahi, hooulu, loina, kuhikuhi, oihana
- Author attribution to experiment station or agricultural agents
- "(Aole i pau)" indicates series with more content
- Specific measurements or instructions visible in text

#### OCR Quality Indicators
- 1900-1910 articles often have better OCR
- Articles with more garbled text may still have valuable content
- Regional names and taro variety names often remain recognizable

### Agent Workflow Pattern

```
1. User provides natural language query
   ↓
2. Agent generates Hawaiian search terms
   ↓
3. Playwright executes searches on newspaper collection
   ↓
4. Agent reviews result counts and titles
   ↓
5. Agent opens promising articles
   ↓
6. Agent extracts and analyzes text (despite OCR issues)
   ↓
7. Agent reports findings with persistent links
```

---

## Challenges Encountered

### 1. Dynamic Content Loading
- **Problem:** Main search results wouldn't load reliably
- **Solution:** Switched to newspaper-specific search which was more stable
- **Future:** May need to investigate the main search JavaScript more

### 2. OCR Text Quality
- **Problem:** Historical newspaper text has significant OCR errors
- **Impact:** Makes keyword matching unreliable for some content
- **Workaround:** Use multiple search terms, look for recognizable patterns
- **Future:** Could implement fuzzy matching or use the original images

### 3. Finding Article Links
- **Problem:** Page has many `<a>` tags, need to filter for actual articles
- **Solution:** Filter by URL pattern (`href.includes('d=')`) and text content (`[ARTICLE]`)

### 4. Text Extraction
- **Problem:** `body.innerText` includes all navigation text
- **Partial Solution:** Filter lines, but still noisy
- **Future:** Better DOM targeting for article text specifically

---

## Recommendations for Next Phase

### Short Term
1. Create reusable search function that handles newspaper collection queries
2. Build article viewer that extracts clean text from article pages
3. Add screenshot capture for visual verification
4. Store results in structured format (JSON) for analysis

### Medium Term
1. Investigate translation features on the site
2. Build query expansion using Hawaiian linguistic knowledge
3. Create researcher-friendly CLI interface
4. Add ability to follow article series ("Aole i pau" continuations)

### Long Term
1. Consider OCR improvement or image-based reading
2. Build knowledge base of successful searches
3. Integrate with Claude for natural language query interpretation
4. Create exportable research reports

---

## Files Created During Testing

| File | Purpose |
|------|---------|
| `test-screenshot.js` | Initial Playwright verification |
| `explore-search.js` | Page structure exploration |
| `search-kalo.js` | Generic search script |
| `search-newspapers.js` | Newspaper collection search |
| `search-loina-kalo.js` | Targeted article search |
| `search-regional.js` | Regional farming article search |
| `view-article.js` | Article text extraction |
| `homepage-screenshot.png` | Papakilo homepage capture |
| `newspapers-home.png` | Newspaper collection home |
| `search-results.png` | Various search result captures |

---

## Key Insights

1. **The newspaper collection is the richest source** for historical Hawaiian language content about traditional practices

2. **Search terms matter enormously** - Hawaiian has specific vocabulary for agricultural practices that yields much better results than English

3. **OCR is imperfect but usable** - Regional names, proper nouns, and structural elements often survive OCR errors

4. **The agent can effectively bridge** the gap between natural language researcher queries and the database's keyword search

5. **Persistent links are valuable** - Every article has a stable URL that can be shared with researchers

6. **Series articles are common** - Many educational articles continued across multiple issues, indicated by "(Aole i pau)"
