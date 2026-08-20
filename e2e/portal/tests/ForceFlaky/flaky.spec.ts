import { test } from '@playwright/test';

let attempt = 0;

test('intentionally flaky smoke test', async () => {
  attempt += 1;
  if (attempt === 1) {
    throw new Error(
      'Intentional first-attempt failure to trigger flaky status',
    );
  }
});
