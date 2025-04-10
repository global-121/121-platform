import { type Page, test } from '@playwright/test';

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
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portalicious/pages/RegistrationActivityLogPage';

const projectId = 2;
let registrationId: number;

const reset = async () => {
  await resetDB(SeedScript.nlrcMultiple);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });
};

const login = async (page: Page, email?: string, password?: string) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(email, password);
};

const goToEditPersonalInformationPage = async (page: Page) => {
  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/project/${projectId}/registrations/${registrationId}`,
  );
  await activityLogPage.navigateToPersonalInformation();
};

test.describe('View available actions for admin', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await reset();
    page = await browser.newPage();
    await login(
      page,
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    );
    await goToEditPersonalInformationPage(page);
  });

  test.beforeEach(async () => {
    const activityLogPage = new RegistrationActivityLogPage(page);
    await activityLogPage.clickEditInformationButton();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('[35234] Edit: FSP', async () => {
    console.log('Edit: FSP in different test case');
    await page.reload();
  });

  test('[35284] Edit: Dropdown Selection fields', async () => {
    const activityLogPage = new RegistrationActivityLogPage(page);
    await activityLogPage.selectDropdownOption({
      dropdownName: 'preferredLanguage',
      option: 'Indonesian',
    });
    await activityLogPage.saveChanges();
  });

  test('[35285] Edit: Text Input fields', async () => {
    console.log('Edit: Text Input fields');
    await page.reload();
  });

  test('[35286] Edit: Number Input fields', async () => {
    console.log('Edit: Number Input fields');
    await page.reload();
  });
});
