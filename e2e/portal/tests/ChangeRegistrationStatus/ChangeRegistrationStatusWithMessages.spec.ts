import { type Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPvStatusChange,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const declineStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Declined" successfully\. The status change can take up to a minute to process\./;
const includeStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Included" successfully\. The status change can take up to a minute to process\./;
const customMessage =
  'Test custom message to change the status of registration';

// Arrange
test.describe('Change status of registration with different message combinations', () => {
  let page: Page;
  let accessToken: string;

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    page = await browser.newPage();
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_ADMIN ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN ?? '',
    );
  });

  test.afterEach(async () => {
    await page.goto('/');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Helper function for common arrangement steps
  async function setupTestEnvironment(): Promise<void> {
    const registrations = new RegistrationsPage(page);
    const loginPage = new LoginPage(page);

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();
  }

  // Act and Assert
  test('[35840] Change status of registration with custom message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV5],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await setupTestEnvironment();

    await test.step('Change status of first selected registration and write a custom message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationsPvStatusChange.registrationPV5.fullName,
        status: 'Decline',
        sendMessage: true,
        sendCustomMessage: true,
        customMessage,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        declineStatusToastMessage,
      );
    });

    await test.step('Find and validate custom message', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationsPvStatusChange.registrationPV5.fullName,
      });
      await tableComponent.validateMessageActivityByTypeAndText({
        notificationType: 'Custom message',
      });
    });
  });

  test('[35849] Change status of registration without custom message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV6],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await setupTestEnvironment();

    await test.step('Change status of first selected registration and do not write a custom message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationsPvStatusChange.registrationPV6.fullName,
        status: 'Decline',
        sendMessage: false,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        declineStatusToastMessage,
      );
    });

    await test.step('Find and validate custom message not present', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationsPvStatusChange.registrationPV6.fullName,
      });
      await tableComponent.validateActivityNotPresentByType('Custom message');
    });
  });

  test('[35912] Change status of registration with templated message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV7],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await setupTestEnvironment();

    await test.step('Change status of first selected registration and send templated message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationsPvStatusChange.registrationPV7.fullName,
        status: 'Include',
        sendMessage: true,
        sendTemplatedMessage: true,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        includeStatusToastMessage,
      );
    });

    await test.step('Find and validate templated message', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationsPvStatusChange.registrationPV7.fullName,
      });
      await tableComponent.validateMessageActivityByTypeAndText({
        notificationType: 'Inclusion',
      });
    });
  });

  test('[35913] Change status of registration without templated message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV8],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await setupTestEnvironment();

    await test.step('Change status of first selected registration without templated message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationsPvStatusChange.registrationPV8.fullName,
        status: 'Include',
        sendMessage: false,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        includeStatusToastMessage,
      );
    });

    await test.step('Find and validate templated message not present', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationsPvStatusChange.registrationPV8.fullName,
      });
      await tableComponent.validateActivityNotPresentByType('Inclusion');
    });
  });
});
