import { readFileSync } from 'fs';
import { join } from 'path';

// Briefs live in the Research_agentic_tool folder already in the repo
const BRIEFS_DIR = join(
  process.cwd(),
  'Research_agentic_tool/papak-agent-playw-1-main/papak-agent-playw-1-main/research-briefs'
);

export type BriefType =
  | 'cultural-practices'
  | 'kalo-cultivation-detailed'
  | 'awa-cultivation-detailed'
  | 'genealogy'
  | 'general';

export function loadBrief(type: BriefType): string {
  if (type === 'general') return GENERAL_BRIEF;
  try {
    return readFileSync(join(BRIEFS_DIR, `${type}.md`), 'utf-8');
  } catch {
    return GENERAL_BRIEF;
  }
}

/**
 * Detects the most appropriate research brief based on query and search terms.
 * Falls back to 'general' when no specific brief matches.
 */
export function detectBriefType(query: string, searchTerms: string[]): BriefType {
  const text = `${query} ${searchTerms.join(' ')}`.toLowerCase();

  if (/\bkalo\b|\btaro\b|\bloi\b|\bhuli\b/.test(text)) return 'kalo-cultivation-detailed';
  if (/\bawa\b|\bkava\b/.test(text)) return 'awa-cultivation-detailed';
  if (/genealog|mookuauhau|ohana|keiki|makua|kupuna|family|lineage|birth|death|marriage|obituar/.test(text))
    return 'genealogy';
  if (/mahi|kanu|farm|cultivat|grow|plant|harvest|soil|loina|oihana|lawaia|fishing|craft/.test(text))
    return 'cultural-practices';

  return 'general';
}

const GENERAL_BRIEF = `# Research Brief: General Hawaiian Research

## Relevance Criteria

### Tier 1 - HIGH VALUE (Include)
Articles that directly address the research topic with substantial detail, specific facts, or primary-source accounts.

### Tier 2 - MODERATE VALUE (Include with caveat)
Articles containing relevant information as a secondary focus, or limited but useful content on the topic.

### Tier 3 - LOW VALUE (Exclude)
Articles that only mention the topic in passing without substantive information.

## Extraction Priorities
1. Direct quotes and specific facts related to the query
2. Place names and regional references (ahupua'a, moku, island)
3. Author names and source type (practitioner vs institutional)
4. Dates and historical context
5. Follow-up leads (related people, series, terms)

## Extraction Taxonomy
| Tag | Description |
|-----|-------------|
| \`historical-fact\` | Specific dated events or facts |
| \`regional-practice\` | Place-specific information |
| \`cultural-practice\` | Traditional methods or customs |
| \`person\` | Named individuals |
| \`location\` | Place names |
`;
