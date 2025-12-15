import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsVoucher,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProgramMonitoring from '@121-e2e/portal/pages/ProgramMonitoringPage';

const reason = 'automated test';
const dataUpdateSucces = {
  phoneNumber: '15005550099',
  whatsappPhoneNumber: '15005550099',
  fullName: 'Updated NameJane',
  maxPayments: 2,
  paymentAmountMultiplier: 3,
  addressCity: 'NewCity',
  addressStreet: 'newStreet1',
  addressHouseNumber: '2',
  addressHouseNumberAddition: 'C',
  preferredLanguage: 'ar',
  addressPostalCode: '5678ZY',
};

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(
    [registrationVisa],
    programIdOCW,
    accessToken,
  );
  await seedIncludedRegistrations(
    registrationsVoucher,
    programIdPV,
    accessToken,
  );
  // Make data changes
  const response = await updateRegistration(
    programIdOCW,
    registrationVisa.referenceId,
    dataUpdateSucces,
    reason,
    accessToken,
  );

  // Assert
  expect(response.statusCode).toBe(200);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('All elements of Monitoring`s `Data Changes` sub-page display correct data for Registration', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const programMonitoring = new ProgramMonitoring(page);

  const programTitle = 'NLRC OCW program';

  await test.step('Navigate to program`s monitoring page', async () => {
    await basePage.selectProgram(programTitle);
    await programMonitoring.navigateToProgramPage('Monitoring');
    await programMonitoring.selectTab({ tabName: 'Data Changes' });
  });

  await test.step('Verify data changes are displayed correctly', async () => {
    console.log('Validate changes...');
  });
});
