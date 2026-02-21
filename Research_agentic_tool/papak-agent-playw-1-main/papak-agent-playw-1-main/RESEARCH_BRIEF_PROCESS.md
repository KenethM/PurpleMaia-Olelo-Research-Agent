# Research Brief Creation Process

This document describes a process for creating new research brief templates through natural language interaction with a CLI coding agent.

## Overview

Research briefs define the criteria for a specific type of research query. Rather than hardcoding all possible research types, we use a conversational process to generate new brief templates from researcher needs.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Researcher     │     │  AI Proposal    │     │  Saved Template │
│  Natural Query  │ ──▶ │  & Refinement   │ ──▶ │  in Codebase    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Process Flow

### Step 1: Researcher States Natural Query

Researcher describes what they're looking for in natural language:

```
"I want to find newspaper articles that mention specific place names
in Waipi'o Valley - streams, land divisions, landmarks - to understand
historical geography of the area."
```

### Step 2: AI Extracts Brief Components

The agent analyzes the query to identify:

| Component | Extracted From Query |
|-----------|---------------------|
| **Research Type** | Geographic/place-based research |
| **Primary Goal** | Historical geography of Waipi'o Valley |
| **Key Entities** | Place names: streams, land divisions (ahupua'a, 'ili), landmarks |
| **Relevance Signal** | Articles that name specific locations within Waipi'o |
| **Peripheral Signal** | Articles that mention "Waipi'o" generally without specific places |

### Step 3: AI Proposes Draft Brief

Agent presents a structured brief for confirmation:

```markdown
## Proposed Research Brief: Waipi'o Geographic Research

**Query Type:** Geographic/Place-based
**Research Goal:** Map historical place names and geography of Waipi'o Valley

### Relevance Criteria
- **Tier 1 (Include):** Names specific streams, land divisions, or landmarks within Waipi'o
- **Tier 2 (Include with caveat):** Describes Waipi'o geography generally without specific names
- **Tier 3 (Exclude):** Mentions Waipi'o only as location context for unrelated content

### Extraction Priorities
1. Place names (Hawaiian) - streams, peaks, land divisions
2. Geographic relationships ("mauka of X", "where X meets Y")
3. Historical changes to places
4. Associated families/persons for each place

### Bias Concerns
- Survey/legal documents may use anglicized or simplified names
- Some place names may only appear in mo'olelo (stories)
- Modern vs. historical boundaries may differ

### Suggested Search Terms
- "Waipio" + geographic terms: kahawai, muliwai, pali, mauna
- Specific known places: [to be added as discovered]
- Land division terms: ahupuaa, ili, kula

Does this match your research needs? What would you adjust?
```

### Step 4: Researcher Confirms or Modifies

Researcher can:
- **Confirm:** "Yes, that looks right"
- **Modify:** "Actually, I also care about agricultural features like lo'i and 'auwai"
- **Clarify:** "I'm specifically interested in the 1800s, not modern references"

Agent updates the brief based on feedback.

### Step 5: Save as Template

Once confirmed, agent saves the brief as a reusable template:

```
research-briefs/
├── cultural-practices.md      # e.g., kalo cultivation
├── genealogy.md               # family/name research
├── geographic-waipio.md       # NEW: generated from this session
└── _template.md               # blank template for reference
```

### Step 6: Brief Recorded with Results

The research results file includes which brief was used:

```markdown
## Research Brief Used
Template: geographic-waipio.md (v1, created 2024-12-17)
Modifications: Added 1800s time constraint per researcher request
```

---

## CLI Agent Implementation Notes

### Required Capabilities

1. **Query Analysis**
   - Parse natural language for research intent
   - Identify entity types (people, places, practices, events)
   - Detect implicit constraints (time periods, regions)

2. **Brief Generation**
   - Map query intent to brief template structure
   - Generate relevance tier criteria specific to query
   - Suggest appropriate search terms in Hawaiian

3. **Interactive Refinement**
   - Present brief in readable format
   - Accept modifications via natural language
   - Track changes for transparency

4. **Template Management**
   - Save new briefs to `research-briefs/` directory
   - Version briefs if they evolve
   - Link results to brief used

### Prompt Structure for Brief Generation

When generating a brief, the agent should consider:

```
Given the researcher's query: "{query}"

1. RESEARCH TYPE: What category does this fall into?
   - Cultural practices (how things were done)
   - Genealogy (people, families, relationships)
   - Geography (places, boundaries, features)
   - Linguistics (word usage, vocabulary, translations)
   - Events (specific happenings, dates)
   - Economic (trade, commerce, prices)
   - Other: {describe}

2. RELEVANCE CRITERIA: What distinguishes...
   - An article that DIRECTLY addresses this query?
   - An article that PARTIALLY addresses this query?
   - An article that only MENTIONS keywords but doesn't help?

3. EXTRACTION PRIORITIES: When reading a relevant article, what
   specific information should be captured?
   - List the types of details that matter for this query
   - Order by importance

4. BIAS CONCERNS: What patterns in the corpus might skew results?
   - Time period effects
   - Source type effects (institutional vs community voices)
   - Regional coverage gaps
   - Language/translation issues

5. SEARCH STRATEGY: What Hawaiian terms and combinations
   would surface relevant articles?
```

### Validation Questions

Before finalizing a brief, agent should verify:

- [ ] Are the relevance tiers specific enough to make consistent decisions?
- [ ] Would two different people apply these criteria the same way?
- [ ] Are extraction priorities actionable given OCR limitations?
- [ ] Are bias concerns relevant to this specific query type?

---

## Brief Template Structure

All briefs follow this structure (see `research-briefs/_template.md`):

```markdown
# Research Brief: {Name}

## Metadata
- **Created:** {date}
- **Query Type:** {category}
- **Version:** {number}

## Research Goal
{1-2 sentence description of what this research aims to find}

## Relevance Criteria

### Tier 1 - Primary Relevance (INCLUDE)
{What makes an article directly relevant}

### Tier 2 - Secondary Relevance (INCLUDE WITH CAVEAT)
{What makes an article partially relevant}

### Tier 3 - Peripheral (EXCLUDE)
{What should be excluded despite keyword matches}

## Extraction Priorities
1. {First priority detail type}
2. {Second priority detail type}
3. {etc.}

## Bias Awareness
- {Bias type 1}: {how it might affect results}
- {Bias type 2}: {how it might affect results}

## Search Strategy

### Primary Terms
- {term 1}
- {term 2}

### Secondary Terms
- {term 1}
- {term 2}

### Term Combinations
- {pattern 1}
- {pattern 2}

## Notes
{Any additional context or constraints}
```

---

## Example Briefs to Create

Based on anticipated research needs:

1. **cultural-practices.md** - How things were done (farming, fishing, crafts)
2. **genealogy.md** - People, families, lineages
3. **geographic.md** - Places, boundaries, features (can be parameterized by region)
4. **events.md** - Historical happenings, dates, participants
5. **linguistic.md** - Word usage, vocabulary in context

---

## Future Enhancements

### Brief Inheritance
Allow briefs to extend a base template:
```markdown
Extends: cultural-practices.md
Specialization: kalo cultivation specifically
```

### Brief Parameterization
Allow briefs to accept parameters:
```markdown
Brief: geographic.md
Parameters:
  region: Waipi'o Valley
  time_period: 1850-1900
```

### Brief Learning
Track which briefs produce good results and refine criteria over time based on researcher feedback.

### Brief Sharing
Export briefs for other researchers working on similar topics.
