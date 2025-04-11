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
import RegistrationPersonalInformationPage from '@121-e2e/portalicious/pages/RegistrationPersonalInformationPage';

let registrationId: number;

const textInputs = [
  { textInputIdName: 'namePartnerOrganization', textInputValue: 'Red Panda' },
  { textInputIdName: 'addressPostalCode', textInputValue: '1234GH' },
  { textInputIdName: 'scope', textInputValue: 'amsterdam.west' },
  { textInputIdName: 'fullName', textInputValue: 'Hovik Karayan' },
  { textInputIdName: 'addressStreet', textInputValue: 'Parklaan' },
  { textInputIdName: 'addressHouseNumberAddition', textInputValue: 'DECK' },
  { textInputIdName: 'addressCity', textInputValue: 'Amsterdam' },
];

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
    `/project/${programIdPV}/registrations/${registrationId}`,
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
    const personalInformationPage = new RegistrationPersonalInformationPage(
      page,
    );
    await personalInformationPage.clickEditInformationButton();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('[35234] Edit: FSP', async () => {
    console.log('Edit: FSP in different test case');
    await page.reload();
  });

  test('[35284] Edit: Dropdown Selection fields', async () => {
    const personalInformationPage = new RegistrationPersonalInformationPage(
      page,
    );
    await personalInformationPage.selectDropdownOption({
      dropdownIdName: 'preferredLanguage',
      option: 'Indonesian',
    });
    await personalInformationPage.saveChanges();
    await personalInformationPage.validatePersonalInformationField(
      'Indonesian',
    );
  });

  test('[35285] Edit: Text Input fields', async () => {
    const personalInformationPage = new RegistrationPersonalInformationPage(
      page,
    );
    // Fill all text inputs
    for (const input of textInputs) {
      await personalInformationPage.fillTextInput(input);
    }

    await personalInformationPage.saveChanges();

    // Define validation expectations
    const validations = [
      { value: 'Red Panda', count: 1 },
      { value: '1234GH', count: 1 },
      { value: 'amsterdam.west', count: 2 },
      { value: 'Hovik Karayan', count: 2 },
      { value: 'Parklaan', count: 1 },
      { value: 'DECK', count: 1 },
      { value: 'Amsterdam', count: 1 },
    ];

    // Validate all fields
    for (const validation of validations) {
      if (validation.count === 1) {
        await personalInformationPage.validatePersonalInformationField(
          validation.value,
        );
      } else {
        await personalInformationPage.validateMultiplePersonalInformationFields(
          {
            fieldValue: validation.value,
            expectedCount: validation.count,
          },
        );
      }
    }
  });

  test('[35286] Edit: Number Input fields', async () => {
    console.log('Edit: Number Input fields');
    await page.reload();
  });
});
