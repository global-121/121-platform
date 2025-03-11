import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getRegistrationIdByReferenceId,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPvScoped,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portalicious/pages/RegistrationActivityLogPage';

const projectId = 2;
let registrationId: number;

test.beforeAll(async ({}) => {
  await resetDB(SeedScript.nlrcMultiple);

  const accessToken = await getAccessToken();
  await seedPaidRegistrations([registrationPvScoped], projectId);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPvScoped.referenceId,
    accessToken,
  });
});

test('User should see a summary of a registration', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/project/${projectId}/registrations/${registrationId}`,
  );

  await test.step('Validate registration title', async () => {
    const title = await activityLogPage.getRegistrationTitle();
    const expectedTitle = `Reg. #1 - ${registrationPvScoped.fullName}`;
    expect(title).toBe(expectedTitle);
  });

  await test.step('Validate registration summary table labels and values', async () => {
    expect(
      await activityLogPage.getDataListItemValue('Registration Status'),
    ).toBe('Included');

    expect(await activityLogPage.getDataListItemValue('Payments')).toBe('1');
    expect(await activityLogPage.getDataListItemValue('Phone number')).toBe(
      registrationPvScoped.phoneNumber,
    );
    expect(await activityLogPage.getDataListItemValue('Scope')).toBe(
      registrationPvScoped.scope,
    );
  });

  await test.step('Validate registration created date', async () => {
    const dateText = await activityLogPage.getRegistrationCreatedDate();

    // Validate it is a valid date
    const isValidDate = !isNaN(Date.parse(dateText));
    expect(isValidDate).toBeTruthy();
  });
});
