# Papakilo Database Natural Language Search - Initial Findings

## Project Goal

Build a tool that allows linguistic researchers to perform flexible, natural language searches of the Papakilo Database (papakilodatabase.com) - a collection of cultural and historical Hawaiian materials currently using traditional keyword search.

## Technical Verification

### Playwright Setup
- **Status**: Working
- **Browser**: Chrome (headless mode)
- **Dependencies**: `@playwright/test@^1.57.0`, `@types/node@^25.0.3`

### Agent Capability
- Can navigate to the site
- Can view and analyze screenshots
- Can interact with page elements (forms, buttons)
- Can extract page data and URLs

## Site Analysis

### Homepage Structure
- **URL**: https://papakilodatabase.com
- **Branding**: Papakilo Database (OHA - Office of Hawaiian Affairs)
- **Navigation**: Kālai, Collection, Libraries, Resources, Newspapers, Using the Search Database, About the Database, Partners, Forums
- **Search**: Simple keyword input with "Search Papakilo" button

### Search Interface
- **Input element**: `#specialsearch_term`
- **Submit button**: `#search_button`
- **Results URL pattern**: `https://www.papakilodatabase.com/main/sourcesearch.php#q:QUERY|r:PAGE|o:OFFSET`
  - `q:` = search query
  - `r:` = results page number
  - `o:` = results offset/per page

### Results Page
- Hash-based routing (client-side navigation)
- Collection filters available (checkboxes):
  - Collections Outside of Hawaii
  - Uncategorized OHA
  - UH Manoa CTAHR
  - Google
  - Bishop Museum Archives
  - Maui Historical Preservation Society
  - Aki Leilani Collection
  - Kamehameha Schools Archives
  - Hawaii State Archives Collection
  - Lahaina Restoration Foundation
  - And more...
- Results display: Thumbnail images with titles and metadata
- Pagination: Shows "1 to 10 of N" format

### Sample Search
- Query: "Lahaina"
- Results: 37,030 items
- Demonstrates broad keyword matching across collections

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Researcher enters natural language query:                  │
│  "Find historical maps of Lahaina before the 1900s"         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Claude (coding agent) interprets and generates:            │
│  - Primary keywords: "Lahaina map"                          │
│  - Alternative queries: "Lahaina survey", "Lahaina chart"   │
│  - Suggested filters: Hawaii State Archives                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Playwright executes searches, captures results             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Agent summarizes findings for researcher review            │
└─────────────────────────────────────────────────────────────┘
```

## Recommended Next Steps

### Option 1: Test the Loop (Quick Validation)
Have the agent try a sample natural language query end-to-end:
- Interpret a research question
- Generate keyword variations
- Execute searches via Playwright
- Summarize results

### Option 2: Build Reusable Tool (Infrastructure)
Create a proper CLI script that:
- Accepts natural language input
- Interfaces with the agent for query expansion
- Runs Playwright searches
- Outputs structured results for researcher review

### Option 3: Deeper Site Exploration (Research)
Investigate:
- Advanced search options
- Collection-specific filtering
- Date range capabilities
- Hawaiian language diacritical handling (okina, kahako)

## Files Created

| File | Purpose |
|------|---------|
| `test-screenshot.js` | Basic Playwright verification - takes homepage screenshot |
| `explore-search.js` | Search interface exploration and testing |
| `homepage-screenshot.png` | Screenshot of Papakilo homepage |
| `search-results.png` | Screenshot of search results for "Lahaina" |

## Notes

- The site uses hash-based routing, meaning results load dynamically via JavaScript
- Large result sets (37k+ for common terms) suggest query refinement will be important
- Multiple collection sources provide opportunity for targeted searching
- Hawaiian language support (diacriticals) should be tested
