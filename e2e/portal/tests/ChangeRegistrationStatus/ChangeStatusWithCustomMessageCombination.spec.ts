import test from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Declined" successfully. The status change can take up to a minute to process.';
const customMessage =
  'Test custom message to change the status of registration';
// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  await seedRegistrations([registrationPV5, registrationPV6], programIdPV);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  // Navigate to program
  const basePage = new BasePage(page);
  await basePage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('[35840] Change status of registration with custom message', async ({
  page,
}) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act
  await test.step('Change status of first selected registration and write a custom message', async () => {
    await tableComponent.changeRegistrationStatusWithCustomMessage({
      status: 'Decline',
      message: customMessage,
    });
    await registrations.validateToastMessageAndClose(toastMessage);
  });

  await test.step('Find and validate custom message', async () => {
    await registrations.goToRegistrationByName({
      registrationName: registrationPV5.fullName,
    });
    await tableComponent.validateMessageActivityByTypeAndText({
      notificationType: 'Custom message',
      message: customMessage,
    });
  });
});
