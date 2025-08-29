import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getRegistrationIdByReferenceId,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';

const projectId = 2;
let registrationId: number;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], projectIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    projectId: projectIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login();
});

test('[34649] User can initiate registration status changes from registration page', async ({
  page,
}) => {
  const activityLogPage = new RegistrationActivityLogPage(page);

  const statusChangeActions = ['Validate', 'Include', 'Decline', 'Delete'];

  for (const actionName of statusChangeActions) {
    await test.step('Navigate to registration', async () => {
      await activityLogPage.goto(
        `/project/${projectId}/registrations/${registrationId}`,
      );
    });

    await test.step(`Initiate action: ${actionName}`, async () => {
      await activityLogPage.initiateAction(actionName);

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const title = dialog.getByText(`${actionName} registration(s)`);
      await expect(title).toBeVisible();

      // Check if the action is only for 1 registration
      const paragraph = dialog.getByText(/You're about to/);
      await expect(paragraph).toContainText(
        `You're about to ${actionName.toLowerCase()} 1 registrations.`,
      );
    });
  }
});

test('[34650] User can open add note sidebar from action menu', async ({
  page,
}) => {
  const activityLogPage = new RegistrationActivityLogPage(page);

  const actionName = 'Add note';

  await test.step('Navigate to registration', async () => {
    await activityLogPage.goto(
      `/project/${projectId}/registrations/${registrationId}`,
    );
  });

  await test.step(`Initiate action: ${actionName}`, async () => {
    await activityLogPage.initiateAction(actionName);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    const sidebarDescription = page.getByText(/You are about to/);
    await expect(sidebarDescription).toBeVisible();
    await expect(sidebarDescription).toHaveText(
      `You are about to add a note to ${registrationPV5.fullName}'s profile. `,
    );
  });
});

test('[34651] User can open message dialog from action menu', async ({
  page,
}) => {
  const activityLogPage = new RegistrationActivityLogPage(page);

  const actionName = 'Message';

  await test.step('Navigate to registration', async () => {
    await activityLogPage.goto(
      `/project/${projectId}/registrations/${registrationId}`,
    );
  });

  await test.step(`Initiate action: ${actionName}`, async () => {
    await activityLogPage.initiateAction(actionName);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const title = dialog.getByRole('heading', { level: 3 });
    await expect(title).toContainText('Send message');
    const paragraph = dialog.getByText(/You're about to/);
    await expect(paragraph).toContainText(
      `You're about to send a message to 1 registration(s).`,
    );
  });
});
