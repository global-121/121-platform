import { env } from '@121-service/src/env';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getAllUsersByProgramId } from '@121-service/test/helpers/user.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Configure payment approval from Program Settings', async ({
  resetDBAndSeedRegistrations,
  programSettingsPaymentApprovalPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    approverMode: ApproverSeedMode.demo,
    navigateToPage: `/program/${programIdOCW}/settings`,
  });

  await test.step('Navigate to payment approval settings page', async () => {
    await programSettingsPaymentApprovalPage.navigateToPaymentApprovalSettings({
      programId: programIdOCW,
    });
  });

  await test.step('Open edit mode for payment approval settings', async () => {
    await programSettingsPaymentApprovalPage.enableEditMode();
  });

  await test.step('Validate editable controls are visible', async () => {
    await programSettingsPaymentApprovalPage.firstStepUsersDropdown.waitFor({
      state: 'visible',
    });
    await programSettingsPaymentApprovalPage.addApprovalStepButton.waitFor({
      state: 'visible',
    });
    await programSettingsPaymentApprovalPage.saveButton.waitFor({
      state: 'visible',
    });
  });
});

test('Save payment approval settings keeps page in read mode and persists values', async ({
  resetDBAndSeedRegistrations,
  programSettingsPaymentApprovalPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    approverMode: ApproverSeedMode.demo,
    navigateToPage: `/program/${programIdOCW}/settings`,
  });

  await programSettingsPaymentApprovalPage.navigateToPaymentApprovalSettings({
    programId: programIdOCW,
  });

  await programSettingsPaymentApprovalPage.enableEditMode();
  const selectedApprover =
    await programSettingsPaymentApprovalPage.selectOneAvailableFirstStepUser();
  await programSettingsPaymentApprovalPage.savePaymentApprovalSettings();
  await programSettingsPaymentApprovalPage.validatePaymentApprovalEditIsClosed();

  await programSettingsPaymentApprovalPage.reloadPaymentApprovalSettings({
    programId: programIdOCW,
  });
  await programSettingsPaymentApprovalPage.validateUserIsShownInPaymentApprovalTable(
    selectedApprover,
  );
});

test('Do not show current logged-in user in first-step approver options', async ({
  resetDBAndSeedRegistrations,
  programSettingsPaymentApprovalPage,
}) => {
  const currentLoggedInUsername = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
  if (!currentLoggedInUsername) {
    throw new Error('USERCONFIG_121_SERVICE_EMAIL_ADMIN is not set');
  }

  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    approverMode: ApproverSeedMode.demo,
    userCredentials: {
      username: currentLoggedInUsername,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    },
    navigateToPage: `/program/${programIdOCW}/settings`,
  });

  await programSettingsPaymentApprovalPage.navigateToPaymentApprovalSettings({
    programId: programIdOCW,
  });

  await programSettingsPaymentApprovalPage.enableEditMode();
  await programSettingsPaymentApprovalPage.validateFirstStepUserOptionIsNotVisible(
    currentLoggedInUsername,
  );
});

test('Pop out preselected current user when opening edit mode', async ({
  resetDBAndSeedRegistrations,
  programSettingsPaymentApprovalPage,
}) => {
  const currentLoggedInUsername = env.USERCONFIG_121_SERVICE_EMAIL_ADMIN;
  if (!currentLoggedInUsername) {
    throw new Error('USERCONFIG_121_SERVICE_EMAIL_ADMIN is not set');
  }

  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    approverMode: ApproverSeedMode.admin,
    userCredentials: {
      username: currentLoggedInUsername,
      password: env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    },
    navigateToPage: `/program/${programIdOCW}/settings`,
  });

  await programSettingsPaymentApprovalPage.navigateToPaymentApprovalSettings({
    programId: programIdOCW,
  });

  await programSettingsPaymentApprovalPage.enableEditMode();

  await programSettingsPaymentApprovalPage.validateFirstStepUserOptionIsNotVisible(
    currentLoggedInUsername,
  );
  await programSettingsPaymentApprovalPage.validateNoFirstStepUserIsPreselected();
});

test('Do not show scoped users in first-step approver options', async ({
  resetDBAndSeedRegistrations,
  programSettingsPaymentApprovalPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    approverMode: ApproverSeedMode.demo,
    navigateToPage: `/program/${programIdOCW}/settings`,
  });

  const accessToken = await getAccessToken();
  const allUsersResponse = await getAllUsersByProgramId({
    accessToken,
    programId: programIdOCW,
  });

  const scopedUsername = `${DebugScope.Kisumu}@example.org`;
  const scopedUser = allUsersResponse.body.find(
    (user) =>
      user.username === scopedUsername && user.scope === DebugScope.Kisumu,
  );

  if (!scopedUser) {
    throw new Error('Required scoped user assignment not found for test setup');
  }

  await programSettingsPaymentApprovalPage.navigateToPaymentApprovalSettings({
    programId: programIdOCW,
  });

  await programSettingsPaymentApprovalPage.enableEditMode();
  await programSettingsPaymentApprovalPage.validateFirstStepUserOptionIsNotVisible(
    scopedUsername,
  );
});

test('Show required validation when first approval step users are empty', async ({
  resetDBAndSeedRegistrations,
  programSettingsPaymentApprovalPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    approverMode: ApproverSeedMode.none,
    navigateToPage: `/program/${programIdOCW}/settings`,
  });

  await programSettingsPaymentApprovalPage.navigateToPaymentApprovalSettings({
    programId: programIdOCW,
  });

  await programSettingsPaymentApprovalPage.enableEditMode();
  await programSettingsPaymentApprovalPage.savePaymentApprovalSettings();

  await programSettingsPaymentApprovalPage.validateErrorMessageVisible(
    'Select at least one user.',
  );
});

test('Show duplicate threshold validation in payment approval settings', async ({
  resetDBAndSeedRegistrations,
  programSettingsPaymentApprovalPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    approverMode: ApproverSeedMode.none,
    navigateToPage: `/program/${programIdOCW}/settings`,
  });

  await programSettingsPaymentApprovalPage.navigateToPaymentApprovalSettings({
    programId: programIdOCW,
  });

  await programSettingsPaymentApprovalPage.enableEditMode();
  await programSettingsPaymentApprovalPage.addApprovalStepAndWaitForThresholdCount(
    1,
  );
  await programSettingsPaymentApprovalPage.addApprovalStepAndWaitForThresholdCount(
    2,
  );
  await programSettingsPaymentApprovalPage.setAdditionalStepThreshold({
    stepIndex: 0,
    value: 100,
  });
  await programSettingsPaymentApprovalPage.setAdditionalStepThreshold({
    stepIndex: 1,
    value: 100,
  });
  await programSettingsPaymentApprovalPage.savePaymentApprovalSettings();
  await programSettingsPaymentApprovalPage.validateErrorMessageVisible(
    'Threshold amounts must be unique.',
  );
});
