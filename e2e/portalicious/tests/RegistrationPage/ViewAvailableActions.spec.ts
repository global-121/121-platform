import { test } from '@playwright/test';
import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import {
  getRegistrationIdByReferenceId,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  addPermissionToRole,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portalicious/pages/RegistrationActivityLogPage';

const projectId = 2;
let registrationId: number;
const statusUpdateLabel = 'Status update';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[34640] User should see actions in actions menu on registration page', async ({
  page,
}) => {
  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/project/${projectId}/registrations/${registrationId}`,
  );

  await test.step('Open action menu', async () => {
    await activityLogPage.clickActionDropdown();
  });

  await test.step('Should display all action menu items', async () => {
    const actions = [
      { label: 'Add note', icon: 'pi pi-pen-to-square' },
      { label: 'Message', icon: 'pi pi-envelope' },
      { label: 'Validate', icon: 'pi pi-check-circle' },
      { label: 'Include', icon: 'pi pi-check' },
      { label: 'Decline', icon: 'pi pi-ban' },
      { label: 'Pause', icon: 'pi pi-pause' },
      { label: 'Delete', icon: 'pi pi-trash' },
    ];

    for (const action of actions) {
      const actionItem = page.getByRole('menuitem', {
        name: action.label,
      });
      await expect(actionItem).toBeVisible();
      const icon = actionItem.locator(`.${action.icon.replace(' ', '.')}`);
      await expect(icon).toBeVisible();
    }
  });

  await test.step(`Should show status update subheader in menu`, async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: statusUpdateLabel,
    });
    await expect(statusUpdateHeader).toBeVisible();
  });
});

test('[34640] User with limited permissions should not see actions menu button on registraiton page', async ({
  page,
}) => {
  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/project/${projectId}/registrations/${registrationId}`,
  );

  await test.step('Should not display action menu button', async () => {
    const actionsButton = page.getByRole('button', { name: 'Actions' });
    await expect(actionsButton).not.toBeVisible();
  });
});

test('[34640] User should only see actions the user has access too in actions menu on profile page', async ({
  page,
}) => {
  await addPermissionToRole(DefaultUserRole.View, [
    PermissionEnum.RegistrationPersonalUPDATE,
  ]);
  // login again to update permissions
  await page.goto(`/logout`);
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
  );

  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/project/${projectId}/registrations/${registrationId}`,
  );

  await test.step('Open action menu', async () => {
    await activityLogPage.clickActionDropdown();
  });

  await test.step('Should only show permitted actions', async () => {
    const vissibleActions = [
      { label: 'Add note', icon: 'pi pi-pen-to-square' },
    ];

    for (const action of vissibleActions) {
      const actionItem = page.getByRole('menuitem', {
        name: action.label,
      });
      await expect(actionItem).toBeVisible();
      const icon = actionItem.locator(`.${action.icon.replace(' ', '.')}`);
      await expect(icon).toBeVisible();
    }
  });

  await test.step('Should hide restricted actions', async () => {
    const hiddenActions = ['Validate', 'Include', 'Decline', 'Pause', 'Delete'];
    for (const action of hiddenActions) {
      const actionItem = page.getByRole('menuitem', {
        name: action,
      });
      await expect(actionItem).not.toBeVisible();
    }
  });

  await test.step(`Should not show 'Status Update' subheader in menu in non of the child items are enabled`, async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: statusUpdateLabel,
    });
    await expect(statusUpdateHeader).not.toBeVisible();
  });
});
