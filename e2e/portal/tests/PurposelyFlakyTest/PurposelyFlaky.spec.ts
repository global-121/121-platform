import { expect, test } from '@playwright/test';

// TEMPORARY — for validating the `find-flaky-changed-tests` CI job only.
// Delete this file before merging; do not commit it to `main`.
// Fails on the first attempt and passes on Playwright's automatic retry, so
// it is reported as "flaky" on every run (requires `retries >= 1`, see
// playwright.config.ts).
test('Purposely flaky test for CI-pipeline validation', () => {
  expect(test.info().retry).toBeGreaterThan(0);
});
