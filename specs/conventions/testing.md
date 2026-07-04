# Testing — Operon

- Red → green → refactor (see `tdd` skill)
- Test at public seams only — no testing private internals
- Prefer integration tests across module boundaries
- Use `./test-wrapper.sh` in Ralph loop to limit output
- Set `TEST_COMMAND` env when test runner is configured
