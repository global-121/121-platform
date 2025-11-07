import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  searchRegistrationByReferenceId,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationPvScoped } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';

const projectId = 2;
let registrationId: number;
let registrationProgramId: number;

test('User should see a summary of a registration', async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  const accessToken = await getAccessToken();
  await seedPaidRegistrations([registrationPvScoped], projectId);
  const searchRegistrationResponse = await searchRegistrationByReferenceId(
    registrationPvScoped.referenceId,
    projectId,
    accessToken,
  );
  const registration = searchRegistrationResponse.body.data[0];
  registrationId = registration.id;
  registrationProgramId = registration.registrationProgramId;

  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login();
  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/project/${projectId}/registrations/${registrationId}`,
  );

  await test.step('Validate registration title', async () => {
    const title = await activityLogPage.getRegistrationTitle();
    const expectedTitle = `Reg. #${registrationProgramId} - ${registrationPvScoped.fullName}`;
    expect(title).toBe(expectedTitle);
  });

  await test.step('Validate registration summary table labels and values', async () => {
    const expectedValueObject = {
      'Registration Status': 'Included',
      Payments: '1',
      'Phone number': registrationPvScoped.phoneNumber,
      Scope: registrationPvScoped.scope,
    };
    const receivedValueObject =
      await activityLogPage.getRegistrationSummaryList();
    expect(receivedValueObject).toMatchObject(expectedValueObject);
  });

  await test.step('Validate registration created date', async () => {
    const dateText = await activityLogPage.getRegistrationCreatedDate();
    // Simple pattern validation for DD/MM/YYYY
    const dateFormatRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    expect(dateFormatRegex.test(dateText)).toBeTruthy();
  });
});
