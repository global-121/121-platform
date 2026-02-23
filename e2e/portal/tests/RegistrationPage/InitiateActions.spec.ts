import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getRegistrationIdByReferenceId } from '@121-service/test/helpers/registration.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import {
  customSharedFixture as test,
  expect,
} from '@121-e2e/portal/fixtures/fixture';

const programId = 2;
let registrationId: number;

test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
  });

  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });
});

test('User can initiate registration status changes from registration page', async ({
  page,
  registrationActivityLogPage,
}) => {
  const statusChangeActions = ['Validate', 'Include', 'Decline', 'Delete'];

  for (const actionName of statusChangeActions) {
    await test.step('Navigate to registration', async () => {
      await registrationActivityLogPage.goto(
        `/program/${programId}/registrations/${registrationId}`,
      );
    });

    await test.step(`Initiate action: ${actionName}`, async () => {
      await registrationActivityLogPage.initiateAction(actionName);

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

test('User can open add note sidebar from action menu', async ({
  page,
  registrationActivityLogPage,
}) => {
  const actionName = 'Add note';

  await test.step('Navigate to registration', async () => {
    await registrationActivityLogPage.goto(
      `/program/${programId}/registrations/${registrationId}`,
    );
  });

  await test.step(`Initiate action: ${actionName}`, async () => {
    await registrationActivityLogPage.initiateAction(actionName);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    const sidebarDescription = page.getByText(/You are about to/);
    await expect(sidebarDescription).toBeVisible();
    await expect(sidebarDescription).toHaveText(
      `You are about to add a note to ${registrationPV5.fullName}'s profile. `,
    );
  });
});

test('User can open message dialog from action menu', async ({
  page,
  registrationActivityLogPage,
}) => {
  const actionName = 'Message';

  await test.step('Navigate to registration', async () => {
    await registrationActivityLogPage.goto(
      `/program/${programId}/registrations/${registrationId}`,
    );
  });

  await test.step(`Initiate action: ${actionName}`, async () => {
    await registrationActivityLogPage.initiateAction(actionName);
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
