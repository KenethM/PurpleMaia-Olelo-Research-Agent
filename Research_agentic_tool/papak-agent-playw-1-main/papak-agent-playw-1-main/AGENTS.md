# Repository Guidelines

## Purpose & Structure
- Goal: enable natural-language research of Papakilo (Hawaiian newspapers) with Playwright helpers.
- Core scripts at repo root: `search-newspapers.js` (query listings + pagination + article URLs), `view-article.js` (pull OCR + save to `raw-articles/`), `download-pdf.js` (open Issue PDF in system browser + copy to `source-pdfs/`), `test-screenshot.js` (connectivity smoke). `search-kalo.js` is legacy.
- Research artifacts: results in `results/`, briefs in `research-briefs/`, state in `research-state/`, raw OCR in `raw-articles/`, PDFs in `source-pdfs/`.
- Sub-agent prompts: `subagents/triage-agent-prompt.md`, `subagents/merge-agent-prompt.md`.
- Reference docs: `README.md`, `CLAUDE.md`, `docs/RESEARCH_WORKFLOW.md`, `docs/SUBAGENT_TESTING.md`, `docs/PDF_DOWNLOAD_NOTES.md`, `docs/INITIAL_FINDINGS.md`, `docs/LESSONS_LEARNED.md`, `docs/RESEARCH_IMPROVEMENT_PLAN.md`, `RESEARCH_BRIEF_PROCESS.md`.

## Research Workflow Summary
- Start with a brief from `research-briefs/` or create one from `_template.md`, and record the brief path in results and state files.
- Apply brief relevance tiers: include Tier 1, include-with-caveat Tier 2, exclude Tier 3.
- Run searches with `search-newspapers.js`. The search engine OR-matches multi-word queries, so longer queries are broader, not narrower. Favor 1-2 specific terms and capture result counts, noise level, and effectiveness.
- Use `--page N` on effective searches to access deeper results. Only fall back to `search-kalo.js` if needed.
- Review articles with `view-article.js`, verify against saved OCR in `raw-articles/`, and note OCR quality explicitly.
- Use the triage sub-agent for batches of 5-8 articles and keep concurrency to 2-3 agents. Merge results sequentially with the merge sub-agent or use the Node merge script approach described in `docs/RESEARCH_WORKFLOW.md`.
- Maintain `research-state/{brief-name}.state.json` across sessions. Update `meta.last_session`, keep `search_ids` on articles (not on searches), and track followups with type/priority/status.
- Update `results/` reports at natural stopping points and include persistent URLs plus bias observations (time period, region, source type).

## Extraction Rules (Anti-Inference)
- Never infer or clean OCR. Quote only what is clearly readable and mark uncertainty with `[OCR unclear]`.
- Record `author` only if a byline is explicitly present.
- Record `region_mentions` only if the article text names the region.
- Provide translations only if the article provides them.
- If OCR is too garbled for reliable extraction, use `download-pdf.js` and note the need for scan verification.

## Build, Test, and Run Commands
```bash
npm install
node search-newspapers.js "kanu kalo"
node search-newspapers.js "kanu kalo" --page 2
node view-article.js "<article-url>"
node download-pdf.js "<article-url>"
node test-screenshot.js
```
Chrome/Chromium must be installed. Scripts launch `channel: 'chrome'` in headless mode; set `headless: false` for debugging. Use forgiving waits (`timeout: 30000` plus short `waitForTimeout` ~4000ms) for dynamic content.

## Coding Style & Naming
- CommonJS (`require`) Node scripts with async IIFEs; prefer `const`/`let`, arrow functions, two-space indentation.
- Keep console output concise (log URLs, saved filenames).
- Screenshots: `newspapers-{term}.png` and `newspapers-{term}-p{N}.png`.
- Research summaries: uppercase snake in `results/` (e.g., `KALO_RESEARCH_RESULTS.md`).
- State files: `research-state/{brief-name}.state.json`.
- PDFs follow issue naming (e.g., `KNK19030327-01.pdf`).

## Testing & Validation
- No automated suite; validate by running the relevant script and checking console output plus generated PNG/TXT/PDF files.
- After modifying sub-agent prompts, re-run verification tests in `docs/SUBAGENT_TESTING.md`.
- When using merge scripts or merge agents, verify counts and IDs against expectations in the workflow doc.

## Security & Rate Limits
- Do not store credentials/cookies; only interact with public pages.
- Respect papakilodatabase.com: avoid tight polling and keep waits explicit.
- Limit triage concurrency to 2-3 agents to reduce load.
- PDF downloads rely on manual CAPTCHA in the system browser; do not attempt to bypass.

## Commit & PR Notes
- Use short, imperative subjects (e.g., `Add Playwright helper for PDF download`).
- PRs should state the research goal, commands run, and outputs produced (paths to screenshots/markdown).
