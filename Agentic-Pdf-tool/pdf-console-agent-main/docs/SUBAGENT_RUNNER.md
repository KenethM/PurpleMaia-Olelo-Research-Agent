# Sub-Agent Runner

This repo includes sub-agent prompt templates for batch document triage and state file merging. These agents run within Claude Code using the Agent tool.

## Triage Agent

**Prompt:** `subagents/triage-agent-prompt.md`

Fetches documents, applies research brief criteria, extracts findings, and returns structured JSON.

### How to Use

1. Collect document paths/IDs from search results
2. Batch into groups of 5-8
3. Launch as Claude Code Agent with the triage prompt, brief criteria, and document list
4. Agent returns JSON matching `subagents/triage-output.schema.json`

### Concurrency

Since all processing is local (no external rate limits), triage agents can run in parallel limited only by local resources.

## Merge Agent

**Prompt:** `subagents/merge-agent-prompt.md`

Takes triage JSON output and merges it into a research state file. Handles deduplication, ID sequencing, and appending.

### How to Use

1. Triage agent completes and returns JSON
2. Launch merge agent with: state file path, triage JSON, search IDs
3. Agent reads current state, deduplicates, assigns IDs, writes updated state

### Sequential Execution

If multiple triage batches need merging, run merge agents **sequentially** — each reads the latest state file including prior merges.

## Alternative: Node.js Merge Script

For full sessions with mixed manual + agent data, writing a merge script is faster and more deterministic than using the merge sub-agent. See `docs/RESEARCH_WORKFLOW.md` for the script pattern.
