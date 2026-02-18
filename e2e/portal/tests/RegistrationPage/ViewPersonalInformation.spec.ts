import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getRegistrationIdByReferenceId,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { registrationWesteros4 } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const programId = 2;
let registrationId: number;
let accessToken: string;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  const result = await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
  accessToken = result.accessToken;
});

test('User can view the registration data of registration that has all data types', async ({
  registrationPersonalInformationPage,
}) => {
  await seedIncludedRegistrations(
    [registrationWesteros4],
    programId,
    accessToken,
  );

  registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId: registrationWesteros4.referenceId,
    accessToken,
  });

  const expectedRegistrationData = {
    Name: 'John Snow',
    FSP: 'Iron Bank',
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

  await registrationPersonalInformationPage.goto(
    `/program/${programId}/registrations/${registrationId}/personal-information`,
  );

  const personalInfo =
    await registrationPersonalInformationPage.personalInformationDataList();
  expect(personalInfo).toMatchObject(expectedRegistrationData);
});

test('User can view the registration data of registration that has only the required data', async ({
  registrationPersonalInformationPage,
}) => {
  const registrationWithOnlyRequiredData = {
    referenceId: registrationWesteros4.referenceId,
    programFspConfigurationName:
      registrationWesteros4.programFspConfigurationName,
    phoneNumber: registrationWesteros4.phoneNumber,
    house: registrationWesteros4.house,
    preferredLanguage: registrationWesteros4.preferredLanguage,
  };
  await seedIncludedRegistrations(
    [registrationWithOnlyRequiredData],
    programId,
    accessToken,
  );

  registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId: registrationWithOnlyRequiredData.referenceId,
    accessToken,
  });

  const expectedRegistrationData = {
    Name: '',
    FSP: 'Iron Bank',
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

  await registrationPersonalInformationPage.goto(
    `/program/${programId}/registrations/${registrationId}/personal-information`,
  );

  const personalInfo =
    await registrationPersonalInformationPage.personalInformationDataList();
  expect(personalInfo).toMatchObject(expectedRegistrationData);
});
