---
description: 'Use when writing or changing unit tests (*.spec.ts), integration/API tests (*.test.ts) or end-to-end tests. Covers which tests to write, test structure and naming.'
applyTo: '**/*.spec.ts, **/*.test.ts'
---

# Test instructions

Rules from section L of the [Software Architecture Guidelines](../../docs/guidelines/software-architecture.md#l-testing) and from [Which tests to automate](../../docs/guidelines/which-tests-to-automate.md) (W), tagged with their section. Those documents are leading and hold the examples.

## Rules

- Every new code branch has at least one test (`AGENTS.md`).
- Unit tests (`*.spec.ts`, mocked) cover logic, branches and edge cases; integration tests (`*.test.ts`, real API calls in `services/121-service/test/`) cover key paths and key error scenarios only (W.3, W.4).
- A unit test that is hard to write is a code smell: split the unit or move stand-alone logic into a helper service with its own test file (W.7).
- Test only public methods (L: Unit testing).
- Assert on results, not on which internal functions were called. `toHaveBeenCalled(With)` is only right when the call itself is the behavior, such as sending a notification (L: Unit testing).
- Delimit each test with `// Arrange`, `// Act`, `// Assert`. Skip `// Arrange` when there is no setup; `// Act & Assert` is fine for `toThrow` checks (L: Arrange, Act, Assert).
- One act-plus-assert per test; do not chain them (L: Arrange, Act, Assert).
- `describe`/`it` describe the scenario and behavior, never the function name (L: Test description naming).
- Default to explicit assertions. Snapshots only when impractical; prefer inline, keep them small, mask dynamic values, review the diff instead of re-recording (L: Snapshot Testing).
- End-to-end tests (`e2e/**/*.spec.ts`, Playwright) cover complete user flows with a `test.step` per step; the structure and naming rules above apply.
- Never commit `fit`, `fdescribe` or `.only`. `any` is allowed only when proper typing makes the test very verbose (`AGENTS.md`).

## Read the full section before

| Task                                         | Read                |
| -------------------------------------------- | ------------------- |
| Deciding whether to write a unit or API test | W                   |
| Using a spy or mock in an assertion          | L: Unit testing     |
| Using a snapshot                             | L: Snapshot Testing |
