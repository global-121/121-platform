---
description: 'Use when writing or changing unit tests (*.spec.ts), integration/API tests (*.test.ts) or end-to-end tests. Covers which tests to write, test structure and naming.'
applyTo: '**/*.spec.ts, **/*.test.ts'
---

# Test instructions

Summary of the testing section of the [Software Architecture Guidelines](../../docs/guidelines/software-architecture.md#l-testing) and of [Which tests to automate](../../docs/guidelines/which-tests-to-automate.md). Those documents are leading.

## Which tests to write

- Every new code branch has at least one test.
- Unit tests (`*.spec.ts`, mocked dependencies) cover business logic, branches and edge cases. Integration tests (`*.test.ts`, real API calls in `services/121-service/test/`) cover key paths and key error scenarios, not every variation.
- A unit test that is hard to write is a code smell: split the unit, or move stand-alone logic into a helper service with its own test file.
- Only test public methods. Private methods are implementation details.

## Test WHAT, not HOW

- Assert on results and behavior, not on which internal functions were called. `toHaveBeenCalled(With)` is only right when the call itself is the behavior, for example sending a notification.

```ts
// ❌ breaks on refactor
expect(getDiscountSpy).toHaveBeenCalledWith(150);

// ✅ tests the behavior
expect(calculateOrderPrice(150)).toBe(135);
```

## Structure

- Delimit each test with `// Arrange`, `// Act`, `// Assert` comments. Skip `// Arrange` when there is no setup; `// Act & Assert` is fine for `expect(() => ...).toThrow()`.
- One action-plus-assertion per test; do not chain act/assert steps.

## Naming

- `describe` and `it` describe the scenario and behavior, not the function name: `describe('Listing enabled Fsps')` with `it('should return all Fsps when none are disabled')`, not `describe('getEnabledFsps')`.

## Snapshots

- Default to explicit assertions. Use snapshots only when that is impractical, prefer `toMatchInlineSnapshot`, keep them small, mask dynamic values, and review the diff instead of re-recording.

## Hygiene

- Never commit `fit`, `fdescribe` or `.only`.
- `any` is allowed in tests only when proper typing would make the test very verbose.
