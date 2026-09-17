import { expect, test } from '@playwright/test';

// TEMPORARY — for validating the `find-flaky-changed-tests` CI job only.
// Delete this file before merging; do not commit it to `main`.
// Fails ~50% of the time, so across `find-flaky`'s repeated runs it has a
// realistic chance of failing once and passing on retry (requires
// `retries >= 1`, see playwright.config.ts), instead of behaving deterministically.
test('Purposely flaky test for CI-pipeline validation', () => {
  expect(Math.random()).toBeGreaterThan(0.5);
});
