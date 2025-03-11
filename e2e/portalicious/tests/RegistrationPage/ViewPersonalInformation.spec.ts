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
import { registrationWesteros4 } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationPersonalInformationPage from '@121-e2e/portalicious/pages/RegistrationPersonalInformationPage';

const projectId = 2;
let registrationId: number;
let accessToken: string;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple);

  accessToken = await getAccessToken();

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('User can view the registration data of registration that has all data types', async ({
  page,
}) => {
  await seedIncludedRegistrations(
    [registrationWesteros4],
    projectId,
    accessToken,
  );

  registrationId = await getRegistrationIdByReferenceId({
    programId: projectId,
    referenceId: registrationWesteros4.referenceId,
    accessToken,
  });

  const exepectedRegistrationData = {
    Name: 'John Snow',
    FSP: 'ironBank',
    'Preferred Language': 'English',
    House: 'Stark',
    'Knows nothing': 'Yes',
    'WhatsApp Nr.': '14155235554',
    'Account Nr.': '123,456,789',
    'Open Answer': 'I know nothing',
    'Health area': 'north',
    'Phone Number': '14155235554',
    'Transfer value multiplier': '2',
    'Inclusion Score': '8',
    'Birth date': '—', // TODO: Add birth date to registration data for now this is skipped because type 'date' has a known bug
    'Dragon count': '1',
    Motto: 'Winter is coming',
    'Personal ID': '',
    Date: '—', // TODO: Add birth date to registration data for now this is skipped because type 'date' has a known bug
    Choice: 'No',
  };

  const personalInfoPage = new RegistrationPersonalInformationPage(page);

  await personalInfoPage.goto(
    `/project/${projectId}/registrations/${registrationId}/personal-information`,
  );

  for (const [key, value] of Object.entries(exepectedRegistrationData)) {
    const fieldValue = await personalInfoPage.getFieldValue(key);
    expect(fieldValue).toBe(value);
  }
});

test('User can view the registration data of registration that has only the required data', async ({
  page,
}) => {
  const registrationWithOnlyRequiredData = {
    referenceId: registrationWesteros4.referenceId,
    programFinancialServiceProviderConfigurationName:
      registrationWesteros4.programFinancialServiceProviderConfigurationName,
    phoneNumber: registrationWesteros4.phoneNumber,
    house: registrationWesteros4.house,
    preferredLanguage: registrationWesteros4.preferredLanguage,
  };
  await seedIncludedRegistrations(
    [registrationWithOnlyRequiredData],
    projectId,
    accessToken,
  );

  registrationId = await getRegistrationIdByReferenceId({
    programId: projectId,
    referenceId: registrationWithOnlyRequiredData.referenceId,
    accessToken,
  });

  const exepectedRegistrationData = {
    Name: '',
    FSP: 'ironBank',
    'Preferred Language': 'English',
    House: 'Stark',
    'Knows nothing': '—',
    'WhatsApp Nr.': '—',
    'Account Nr.': '—',
    'Open Answer': '',
    'Health area': '',
    'Phone Number': '14155235554',
    'Transfer value multiplier': '1',
    'Inclusion Score': '6',
    'Birth date': '—',
    'Dragon count': '—',
    Motto: '',
    'Personal ID': '',
    Date: '—',
    Choice: '—',
  };

  const personalInfoPage = new RegistrationPersonalInformationPage(page);

  await personalInfoPage.goto(
    `/project/${projectId}/registrations/${registrationId}/personal-information`,
  );

  for (const [key, value] of Object.entries(exepectedRegistrationData)) {
    const fieldValue = await personalInfoPage.getFieldValue(key);
    expect(fieldValue).toBe(value);
  }
});
