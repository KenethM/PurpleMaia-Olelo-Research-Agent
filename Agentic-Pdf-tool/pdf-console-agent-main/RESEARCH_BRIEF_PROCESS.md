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
"I want to find CTAHR documents about soil conservation methods
specific to Hawaiian agricultural conditions."
```

### Step 2: AI Extracts Brief Components

The agent analyzes the query to identify:

| Component | Extracted From Query |
|-----------|---------------------|
| **Research Type** | Agricultural practice / soil science |
| **Primary Goal** | Soil conservation methods for Hawaii |
| **Key Entities** | Conservation techniques, soil types, crop-specific advice |
| **Relevance Signal** | Documents with substantive conservation methods or research findings |
| **Peripheral Signal** | Documents that mention "soil" generally without conservation focus |

### Step 3: AI Proposes Draft Brief

Agent presents a structured brief for confirmation:

```markdown
## Proposed Research Brief: Soil Conservation

**Query Type:** Agricultural Practice
**Research Goal:** Find CTAHR documents on soil conservation methods applicable to Hawaii

### Relevance Criteria
- **Tier 1 (Include):** Directly discusses soil conservation techniques, erosion control, or soil health management with Hawaii-specific context
- **Tier 2 (Include with caveat):** Contains some soil conservation info but primarily about another topic (e.g., a crop guide with a soil management section)
- **Tier 3 (Exclude):** Mentions soil only in passing or in unrelated context (e.g., a faculty bio listing "soil science" as interest)

### Extraction Priorities
1. Specific conservation techniques and methods
2. Soil types and conditions discussed
3. Crops or land use contexts
4. Measurable outcomes or research findings
5. Geographic specificity within Hawaii

### Bias Concerns
- PDF-heavy results may miss relevant slide presentations
- Older documents may not appear if text extraction is poor
- Research papers may dominate over extension guides that are more practical

### Suggested Search Terms
- "soil conservation", "erosion control", "soil health"
- "cover crop", "mulch", "no-till"
- Specific soil types: "andisol", "oxisol", "volcanic soil"

Does this match your research needs? What would you adjust?
```

### Step 4: Researcher Confirms or Modifies

Researcher can:
- **Confirm:** "Yes, that looks right"
- **Modify:** "Actually, I'm more interested in erosion specifically, not general soil health"
- **Clarify:** "I want to focus on documents from the last 10 years"

Agent updates the brief based on feedback.

### Step 5: Save as Template

Once confirmed, agent saves the brief as a reusable template:

```
research-briefs/
├── ctahr-general.md              # General collection exploration
├── soil-conservation.md          # NEW: generated from this session
└── _template.md                  # blank template for reference
```

### Step 6: Brief Recorded with Results

The research results file includes which brief was used:

```markdown
## Research Brief Used
Template: soil-conservation.md (v1, created 2026-03-19)
Modifications: Added erosion focus per researcher request
```

---

## CLI Agent Implementation Notes

### Required Capabilities

1. **Query Analysis**
   - Parse natural language for research intent
   - Identify entity types (methods, organisms, regions, materials)
   - Detect implicit constraints (time periods, document types)

2. **Brief Generation**
   - Map query intent to brief template structure
   - Generate relevance tier criteria specific to query
   - Suggest appropriate search terms

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
   - Agricultural practices (farming, soil, water management)
   - Pest management (insects, diseases, invasive species)
   - Animal science (livestock, veterinary, aquaculture)
   - Food science (processing, safety, nutrition)
   - Environmental (conservation, ecology, sustainability)
   - Extension/outreach (community programs, education)
   - Other: {describe}

2. RELEVANCE CRITERIA: What distinguishes...
   - A document that DIRECTLY addresses this query?
   - A document that PARTIALLY addresses this query?
   - A document that only MENTIONS keywords but doesn't help?

3. EXTRACTION PRIORITIES: When reading a relevant document, what
   specific information should be captured?
   - List the types of details that matter for this query
   - Order by importance

4. BIAS CONCERNS: What patterns in the collection might skew results?
   - Collection coverage gaps
   - Document type effects (PDFs vs slides vs images)
   - Time period effects
   - Text extraction limitations

5. SEARCH STRATEGY: What terms and combinations
   would surface relevant documents?
```

### Validation Questions

Before finalizing a brief, agent should verify:

- [ ] Are the relevance tiers specific enough to make consistent decisions?
- [ ] Would two different people apply these criteria the same way?
- [ ] Are extraction priorities actionable given text extraction limitations?
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
{What makes a document directly relevant}

### Tier 2 - Secondary Relevance (INCLUDE WITH CAVEAT)
{What makes a document partially relevant}

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

### Term Variations
- {synonyms, abbreviations, scientific names}

## Notes
{Any additional context or constraints}
```

---

## Example Briefs to Create

Based on anticipated research needs:

1. **soil-conservation.md** - Erosion control, soil health, land management
2. **pest-management.md** - Insects, diseases, invasive species, biocontrol
3. **crop-production.md** - Specific crop guides, variety trials, yield data
4. **livestock.md** - Animal husbandry, veterinary, feed/nutrition
5. **food-safety.md** - Processing, handling, safety protocols

---

## Future Enhancements

### Brief Inheritance
Allow briefs to extend a base template:
```markdown
Extends: crop-production.md
Specialization: tropical fruit specifically
```

### Brief Parameterization
Allow briefs to accept parameters:
```markdown
Brief: crop-production.md
Parameters:
  crop: coffee
  focus: disease resistance
```

### Brief Learning
Track which briefs produce good results and refine criteria over time based on researcher feedback.

### Brief Sharing
Export briefs for other researchers working on similar topics.
