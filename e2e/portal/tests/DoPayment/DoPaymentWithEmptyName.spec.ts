import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsVisa,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('Cannot proceed with an empty payment name', async ({ paymentsPage }) => {
  await paymentsPage.createNewPaymentButton.click();

  // Clear the default name
  await paymentsPage.paymentNameInput.clear();

  // Validation should prevent proceeding by disabling the button
  await expect(paymentsPage.continueToRegistrationButton).toBeDisabled();

  // Assert we are still on step 1
  await expect(paymentsPage.continueToRegistrationButton).toBeVisible();
});
