import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { getRegistrationIdByReferenceId } from '@121-service/test/helpers/registration.helper';
import { addPermissionToRole } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';

let registrationId: number;

async function setupAndNavigateToRegistration(
  fixtures: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Fixture type is complex with multiple optional parameters
    resetDBAndSeedRegistrations: any;
    registrationActivityLogPage: RegistrationActivityLogPage;
  },
  credentials?: { username: string; password: string },
) {
  const { accessToken } = await fixtures.resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedWithStatus: RegistrationStatusEnum.included,
    registrations: [registrationPV5],
    programId: programIdPV,
    ...(credentials && {
      username: credentials.username,
      password: credentials.password,
    }),
  });
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });
  await fixtures.registrationActivityLogPage.goto(
    `/program/${programIdPV}/registrations/${registrationId}`,
  );
  return { accessToken };
}

test('Admin should see all expected actions', async ({
  resetDBAndSeedRegistrations,
  registrationActivityLogPage,
  page,
}) => {
  await test.step('Setup and navigate', async () => {
    await setupAndNavigateToRegistration({
      resetDBAndSeedRegistrations,
      registrationActivityLogPage,
    });
  });

  await test.step('Open action menu', async () => {
    await registrationActivityLogPage.clickActionDropdown();
  });

  await test.step('Admin should see action button on registration page', async () => {
    // Assert
    const actionsButton = page.getByRole('button', { name: 'Actions' });
    await expect(actionsButton).toBeVisible();
  });

  await test.step('Admin should see "status update" subheader in actions menu', async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: 'Status update',
    });
    await expect(statusUpdateHeader).toBeVisible();
  });

  const actions = [
    { label: 'Add note', icon: 'pi pi-pen-to-square' },
    { label: 'Message', icon: 'pi pi-envelope' },
    { label: 'Validate', icon: 'pi pi-check-circle' },
    { label: 'Include', icon: 'pi pi-check' },
    { label: 'Decline', icon: 'pi pi-ban' },
    { label: 'Pause', icon: 'pi pi-pause' },
    { label: 'Delete', icon: 'pi pi-trash' },
  ];
  for (const { label, icon } of actions) {
    await test.step(`Admin should see "${label}" action in action menu`, async () => {
      // Assert
      const actionItem = page.getByRole('menuitem', {
        name: label,
      });
      await expect(actionItem).toBeVisible();
      const iconLocator = actionItem.locator(`.${icon.replace(' ', '.')}`);
      await expect(iconLocator).toBeVisible();
    });
  }
});

// We need an account with permissions to perform actions, but less than admin.
test('CVA Officer should see expected actions', async ({
  resetDBAndSeedRegistrations,
  registrationActivityLogPage,
  page,
}) => {
  await test.step('Setup and navigate', async () => {
    await setupAndNavigateToRegistration(
      {
        resetDBAndSeedRegistrations,
        registrationActivityLogPage,
      },
      {
        username: env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER ?? '',
        password: env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER ?? '',
      },
    );
  });

  await test.step('Open action menu', async () => {
    await registrationActivityLogPage.clickActionDropdown();
  });

  await test.step('CVA Officer should see action button on registration page', async () => {
    // Assert
    const actionsButton = page.getByRole('button', { name: 'Actions' });
    await expect(actionsButton).toBeVisible();
  });

  await test.step('CVA Officer should see "status update" subheader in actions menu', async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: 'Status update',
    });
    await expect(statusUpdateHeader).toBeVisible();
  });

  const actions = [
    { label: 'Add note', icon: 'pi pi-pen-to-square', visible: true },
    { label: 'Message', icon: 'pi pi-envelope', visible: true },
    { label: 'Validate', icon: 'pi pi-check-circle', visible: true },
    { label: 'Include', icon: 'pi pi-check', visible: false },
    { label: 'Decline', icon: 'pi pi-ban', visible: true },
    { label: 'Pause', icon: 'pi pi-pause', visible: true },
    { label: 'Delete', icon: 'pi pi-trash', visible: false },
  ];
  for (const { label, icon, visible } of actions) {
    await test.step(`CVA Officer should ${visible ? '' : 'not'} see "${label}" action in action menu`, async () => {
      // Assert
      const actionItem = page.getByRole('menuitem', {
        name: label,
      });
      if (visible) {
        await expect(actionItem).toBeVisible();
        const iconLocator = actionItem.locator(`.${icon.replace(' ', '.')}`);
        await expect(iconLocator).toBeVisible();
      } else {
        await expect(actionItem).not.toBeVisible();
      }
    });
  }
});

// "viewOnlyUser" has even less permissions, we manually add a single one to be
// able to see the actions menu
test('"View Only" user should see expected actions', async ({
  resetDBAndSeedRegistrations,
  registrationActivityLogPage,
  loginPage,
  page,
}) => {
  await test.step('Setup and navigate', async () => {
    // Setup with admin user first
    await setupAndNavigateToRegistration({
      resetDBAndSeedRegistrations,
      registrationActivityLogPage,
    });
    // Logout as admin to add permissions to "viewOnlyUser"
    await page.goto('/logout');
    // Add UPDATE permission to "viewOnlyUser" so that the actions menu becomes visible
    await addPermissionToRole(DefaultUserRole.View, [
      PermissionEnum.RegistrationPersonalUPDATE,
    ]);
    // Login as "viewOnlyUser" and navigate to registration activity log page
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
    );
    // Navigate to the registration activity log page of the seeded registration
    await registrationActivityLogPage.goto(
      `/program/${programIdPV}/registrations/${registrationId}`,
    );
  });

  await test.step('Open action menu', async () => {
    await registrationActivityLogPage.clickActionDropdown();
  });

  await test.step('"View Only" user should see action button on registration page', async () => {
    // Assert
    const actionsButton = page.getByRole('button', { name: 'Actions' });
    await expect(actionsButton).toBeVisible();
  });

  await test.step('"View Only" user should not see "status update" subheader in actions menu', async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: 'Status update',
    });
    await expect(statusUpdateHeader).not.toBeVisible();
  });

  const actions = [
    { label: 'Add note', icon: 'pi pi-pen-to-square', visible: true },
    { label: 'Message', icon: 'pi pi-envelope', visible: false },
    { label: 'Validate', icon: 'pi pi-check-circle', visible: false },
    { label: 'Include', icon: 'pi pi-check', visible: false },
    { label: 'Decline', icon: 'pi pi-ban', visible: false },
    { label: 'Pause', icon: 'pi pi-pause', visible: false },
    { label: 'Delete', icon: 'pi pi-trash', visible: false },
  ];
  for (const { label, icon, visible } of actions) {
    await test.step(`"View Only" user should ${visible ? '' : 'not'} see "${label}" action in action menu`, async () => {
      // Assert
      const actionItem = page.getByRole('menuitem', {
        name: label,
      });
      if (visible) {
        await expect(actionItem).toBeVisible();
        const iconLocator = actionItem.locator(`.${icon.replace(' ', '.')}`);
        await expect(iconLocator).toBeVisible();
      } else {
        await expect(actionItem).not.toBeVisible();
      }
    });
  }
});
