# Sub-Agent Testing

Verification results for the triage and merge sub-agents. Run these tests after modifying prompt templates to confirm correct behavior.

## Test Strategy

Use documents with **known expected tiers** from previous manual review. Include a mix of:
- A document already in the state file (tests deduplication)
- Documents not in the state file across multiple tiers (tests triage accuracy and merge correctness)

## Running Tests

To test after modifying sub-agent prompts:

1. Create a test state file:
   ```bash
   cp research-state/ctahr-general.state.json /tmp/test-state.json
   ```

2. Launch triage agent with known test documents (include mix of existing + new, multiple tiers)

3. Launch merge agent pointing at the test state file

4. Verify with:
   ```javascript
   node -e "
   const state = require('/tmp/test-state.json');
   console.log('Documents:', state.documents.length);
   console.log('Findings:', state.findings.length);
   console.log('Followups:', state.followups.length);
   console.log('last_session:', state.meta.last_session);
   "
   ```

## Test Results

_(No tests run yet — populate after first research session with known documents)_
