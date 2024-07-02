import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { expect, test } from '@playwright/test';

test.beforeEach(async () => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);
});

// This test is here to just load the homepage
// and check if it loads without any errors.
// Later we can port the existing tests to check the functionality
// but for now, this is just a placeholder to make sure
// we don't break the infrastructure that runs the tests.
test('Load Homepage', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe('121 Portal(icious)');
});
