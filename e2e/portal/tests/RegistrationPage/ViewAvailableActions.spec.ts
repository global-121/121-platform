import { type Page, test } from '@playwright/test';
import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
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
  projectIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';

const projectId = 2;
let registrationId: number;

const reset = async () => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], projectIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    projectId: projectIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });
};

const login = async (page: Page, email?: string, password?: string) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(email, password);
};

const goToActivityLogPage = async (page: Page) => {
  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/project/${projectId}/registrations/${registrationId}`,
  );
  return activityLogPage;
};

test.describe('View available actions for admin', () => {
  let page: Page;
  let activityLogPage: RegistrationActivityLogPage;

  test.beforeAll(async ({ browser }) => {
    await reset();
    page = await browser.newPage();
    await login(page);
    activityLogPage = await goToActivityLogPage(page);
    await test.step('Open action menu', async () => {
      await activityLogPage.clickActionDropdown();
    });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('[34640] Admin should see action button on registration page', async () => {
    // Assert
    const actionsButton = page.getByRole('button', { name: 'Actions' });
    await expect(actionsButton).toBeVisible();
  });

  test(`[34640] Admin should see "status update" subheader in actions menu`, async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: 'Status update',
    });
    await expect(statusUpdateHeader).toBeVisible();
  });

  [
    { label: 'Add note', icon: 'pi pi-pen-to-square' },
    { label: 'Message', icon: 'pi pi-envelope' },
    { label: 'Validate', icon: 'pi pi-check-circle' },
    { label: 'Include', icon: 'pi pi-check' },
    { label: 'Decline', icon: 'pi pi-ban' },
    { label: 'Pause', icon: 'pi pi-pause' },
    { label: 'Delete', icon: 'pi pi-trash' },
  ].forEach(({ label, icon }) => {
    test(`[34640] Admin should see "${label}" action in action menu`, async () => {
      // Assert
      const actionItem = page.getByRole('menuitem', {
        name: label,
      });
      await expect(actionItem).toBeVisible();
      const iconLocator = actionItem.locator(`.${icon.replace(' ', '.')}`);
      await expect(iconLocator).toBeVisible();
    });
  });
});

// We need an account with permissions to perform actions, but less than admin.
test.describe('View available actions for CVA officer', () => {
  let page: Page;
  let activityLogPage: RegistrationActivityLogPage;

  test.beforeAll(async ({ browser }) => {
    await reset();
    page = await browser.newPage();
    await login(
      page,
      env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER ?? '',
    );
    activityLogPage = await goToActivityLogPage(page);
    await test.step('Open action menu', async () => {
      await activityLogPage.clickActionDropdown();
    });
  });

  test('[34640] CVA Officer should see action button on registration page', async () => {
    // Assert
    const actionsButton = page.getByRole('button', { name: 'Actions' });
    await expect(actionsButton).toBeVisible();
  });

  test(`[34640] CVA Officer should see "status update" subheader in actions menu`, async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: 'Status update',
    });
    await expect(statusUpdateHeader).toBeVisible();
  });

  [
    { label: 'Add note', icon: 'pi pi-pen-to-square', visible: true },
    { label: 'Message', icon: 'pi pi-envelope', visible: true },
    { label: 'Validate', icon: 'pi pi-check-circle', visible: true },
    { label: 'Include', icon: 'pi pi-check', visible: false },
    { label: 'Decline', icon: 'pi pi-ban', visible: true },
    { label: 'Pause', icon: 'pi pi-pause', visible: true },
    { label: 'Delete', icon: 'pi pi-trash', visible: false },
  ].forEach(({ label, icon, visible }) => {
    test(`[34640] CVA Officer should ${visible ? '' : 'not'} see "${label}" action in action menu`, async () => {
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
  });
});

// "viewOnlyUser" has even less permissions, we manually add a single one to be
// able to see the actions menu
test.describe('View available actions for a "view only" user', () => {
  let page: Page;
  let activityLogPage: RegistrationActivityLogPage;

  test.beforeAll(async ({ browser }) => {
    await reset();
    await addPermissionToRole(DefaultUserRole.View, [
      PermissionEnum.RegistrationPersonalUPDATE,
    ]);
    page = await browser.newPage();
    await login(
      page,
      env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
    );
    activityLogPage = await goToActivityLogPage(page);
    await test.step('Open action menu', async () => {
      await activityLogPage.clickActionDropdown();
    });
  });

  test('[34640] "View Only" user should see action button on registration page', async () => {
    // Assert
    const actionsButton = page.getByRole('button', { name: 'Actions' });
    await expect(actionsButton).toBeVisible();
  });

  test(`[34640] "View Only" user should not see "status update" subheader in actions menu`, async () => {
    // Resorted to locator as getByRole does not seems to work for menu items that are a subheader
    const menu = page.locator('.p-menu-list');
    const statusUpdateHeader = menu.locator(':scope > li', {
      hasText: 'Status update',
    });
    await expect(statusUpdateHeader).not.toBeVisible();
  });

  [
    { label: 'Add note', icon: 'pi pi-pen-to-square', visible: true },
    { label: 'Message', icon: 'pi pi-envelope', visible: false },
    { label: 'Validate', icon: 'pi pi-check-circle', visible: false },
    { label: 'Include', icon: 'pi pi-check', visible: false },
    { label: 'Decline', icon: 'pi pi-ban', visible: false },
    { label: 'Pause', icon: 'pi pi-pause', visible: false },
    { label: 'Delete', icon: 'pi pi-trash', visible: false },
  ].forEach(({ label, icon, visible }) => {
    test(`[34640] "View Only" user should ${visible ? '' : 'not'} see "${label}" action in action menu`, async () => {
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
  });
});
