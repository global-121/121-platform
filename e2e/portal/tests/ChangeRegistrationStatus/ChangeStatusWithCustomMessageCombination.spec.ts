import { type Page, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const toastMessage =
  'The status of 1 registration(s) is being changed to "Declined" successfully. The status change can take up to a minute to process.';
const customMessage =
  'Test custom message to change the status of registration';
// Arrange
const reset = async () => {
  await resetDB(SeedScript.nlrcMultiple);
  await seedRegistrations([registrationPV5, registrationPV6], programIdPV);
};

const login = async (page: Page, email?: string, password?: string) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(email, password);
  // Navigate to program
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
};

const navigateToRegistrationsAndResetFilters = async (page: Page) => {
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

  test.afterEach(async () => {
    await navigateToRegistrationsAndResetFilters(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Act
  test('[35840] Change status of registration with custom message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    await test.step('Change status of first selected registration and write a custom message', async () => {
      await tableComponent.changeRegistrationStatusByNameWithCustomMessage({
        registrationName: registrationPV5.fullName,
        status: 'Decline',
        message: customMessage,
        customMessage: true,
      });
      await registrations.validateToastMessageAndWait(toastMessage);
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

  test('[35849] Change status of registration without custom message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    // Act
    await test.step('Change status of first selected registration and write a custom message', async () => {
      await tableComponent.changeRegistrationStatusByNameWithCustomMessage({
        registrationName: registrationPV6.fullName,
        status: 'Decline',
        message: customMessage,
        customMessage: false,
      });
      await registrations.validateToastMessageAndWait(toastMessage);
    });

    await test.step('Find and validate custom message', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationPV6.fullName,
      });
      await tableComponent.validateActivityNotPresentByType('Custom message');
    });
  });
});
