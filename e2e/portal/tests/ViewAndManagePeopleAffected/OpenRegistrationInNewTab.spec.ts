import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const chosenRegistration = registrationsPV[registrationsPV.length - 1];

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Open registration in new tab and verify new tab', async ({
  registrationsPage,
  page,
}) => {
  await test.step('Open registration in new tab', async () => {
    // Count all registrations
    const allRegistrationsCount = registrationsPV.length;

    // Wait for page to load
    await registrationsPage.waitForLoaded(allRegistrationsCount);

    // Get the first registration's full name from the table
    const registrationName = chosenRegistration.fullName;

    await registrationsPage.performActionOnRegistrationByName({
      registrationName,
      action: 'Open in new tab',
    });
  });

  await test.step('Verify new tab is opened', async () => {
    await page.waitForTimeout(2000); //waitForNavigation and waitForLoadState do not work in this case

    const pages = page.context().pages();

    expect(pages).toHaveLength(2);

    expect(await pages[1].title()).toEqual(
      'Activity log | Registration details | 121 Portal',
    );

    const pageHeader = await pages[1].$('h1');

    expect(await pageHeader?.textContent()).toContain(
      chosenRegistration.fullName,
    );
  });
});
