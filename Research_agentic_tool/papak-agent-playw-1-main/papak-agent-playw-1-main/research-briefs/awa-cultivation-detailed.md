# Research Brief: Awa Cultivation (Detailed)

## Metadata
- **Created:** 2024-12-18
- **Query Type:** Cultural practices - Agricultural (specialized)
- **Extends:** cultural-practices.md
- **Version:** 1

## Research Goal

Find newspaper articles about **awa/kava farming and cultivation** with emphasis on:
- Growing methods and planting techniques
- Soil preparation and nutrition requirements
- Regional practices for awa cultivation

Varietals are of interest **only when connected to farming or soil information**.

## Relevance Criteria

### Tier 1 - HIGH VALUE (Include, prioritize in results)
Articles that contain ANY of:
- **Soil/nutrition techniques** for awa (fertilizers, soil types, preparation, amendments)
- **Specific growing methods** (planting, spacing, water needs, shade requirements)
- **Regional cultivation practices** (e.g., "in Puna they grow awa this way")
- Detailed harvesting or propagation techniques

### Tier 2 - MODERATE VALUE (Include)
- General cultivation advice without regional/soil specifics
- Awa varieties **if discussed in context of growing characteristics** (e.g., "this variety prefers wet soil")
- Historical accounts of awa farming as practice
- Comparison of growing conditions or methods

### Tier 3 - LOW VALUE (Exclude unless notable)
- Awa varieties listed without cultivation information
- Medicinal/ceremonial uses of awa without farming content
- Awa mentioned as trade good or product without growing details
- Exhortations to plant awa without explaining how
- Awa mentioned only in passing among other plants

## Extraction Priorities

When reading relevant articles, capture in this order:

1. **Soil/nutrition details** - Soil types, preparation methods, fertilizers, amendments, drainage
2. **Growing conditions** - Shade, water, elevation, climate preferences
3. **Planting techniques** - Propagation, spacing, timing, seasons
4. **Regional information** - Which areas, local variations, site selection
5. **Harvesting methods** - When to harvest, how to harvest, root maturity signs
6. **Variety names** - ONLY when tied to growing characteristics (note if varieties mentioned without cultivation context)
7. **Author/source type** - Traditional practitioner vs institutional source

## Extraction Taxonomy

Canonical tags for findings. Use `tags_extra` in state file only to propose additions.

| Tag | Description |
|-----|-------------|
| `propagation` | Planting, cutting, transplanting methods |
| `soil` | Soil types, preparation, amendments, drainage |
| `variety` | Named cultivars with growing characteristics |
| `harvest` | When/how to harvest, maturity indicators |
| `water` | Irrigation, rainfall, moisture requirements |
| `shade` | Light/shade preferences, canopy, malu |
| `pests` | Diseases, pests, treatments |
| `regional-practice` | Place-specific methods or variations |

## Source Weighting

**Prefer traditional knowledge sources** when available:
- Articles by named Hawaiian practitioners
- Regional correspondents describing local methods
- Mo'olelo or narratives about cultivation
- Letters describing family or community practices

**Institutional sources acceptable** (government, experiment stations) when:
- Traditional sources not available
- They provide unique growing details (experiments, measurements)
- Note source type in summary

**When presenting results:** Lead with traditional knowledge sources where possible; group institutional sources separately or note their origin clearly.

## Bias Awareness

- **Source type**: Institutional articles may dominate; actively seek practitioner voices
- **Medicinal focus**: Many awa articles may focus on uses rather than cultivation
- **Regional coverage**: Some growing regions may have more coverage than others
- **Time period**: Older articles may assume cultivation knowledge; newer may be more explicit
- **OCR quality**: Plant/soil terminology may be affected by OCR errors

## Search Strategy

### Primary Terms (High Yield)
- "kanu awa" - planting awa
- "mahi awa" - cultivating awa
- "hooulu awa" - growing awa

### Soil/Nutrition Specific
- "lepo awa" - awa soil
- "aina awa" - awa land
- "momona" + awa context - fertile/rich soil
- "mea hoomomona" + awa - fertilizer for awa

### Growing Conditions
- "malu" - shade (awa often grown in shade)
- "wai" + awa context - water requirements
- "ulu awa" - awa growth

### Traditional Knowledge Terms
- "loina kanu awa" - traditions of planting awa
- "na kupuna" + awa - ancestral methods

### Regional Searches
- "awa Puna" - awa in Puna (known growing region)
- "awa [region]" - for specific areas of interest

## OCR Handling

**For variety names:** Only report if tied to cultivation info. Note: "Article mentions variety X as preferring shade" vs "Article lists varieties without growing context (excluded per brief)."

**For soil/growing terms:** Quote directly when possible; mark unclear passages with [OCR unclear].

## Notes

This brief prioritizes **farming and soil information over botanical cataloging**. An article with soil preparation advice is more valuable than a list of 20 variety names without growing context. When ranking results:
1. Lead with articles containing soil, growing conditions, or planting techniques
2. Include variety information only when it informs cultivation choices
3. Note source type so researchers can weight accordingly
