import { expect, test } from '@playwright/test';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsp-management/fsp-settings.const';
import { UpdateProgramFspConfigurationDto } from '@121-service/src/program-fsp-configurations/dtos/update-program-fsp-configuration.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { patchProgramFspConfiguration } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getRegistrationIdByReferenceId,
  linkVisaCardOnSite,
  seedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationOCW1 } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationDebitCardPage from '@121-e2e/portal/pages/RegistrationDebitCardPage';

const oldVisaCardNumber = '1111222233334444555';
const newVisaCardNumber = '5555444433332222111';
let registrationId: number;
let accessToken: string;
const updateProgramFspConfigurationDto: UpdateProgramFspConfigurationDto = {
  label: {
    en: FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  },
  properties: [
    {
      name: FspConfigurationProperties.cardDistributionByMail,
      value: 'false',
    },
    {
      name: FspConfigurationProperties.brandCode,
      value: 'test-INTERSOLVE_VISA_BRAND_CODE',
    },
    {
      name: FspConfigurationProperties.coverLetterCode,
      value: 'TESTINTERSOLVEVISACOVERLETTERCODE',
    },
    {
      name: FspConfigurationProperties.fundingTokenCode,
      value: 'test_INTERSOLVE_VISA_FUNDINGTOKEN_CODE',
    },
  ],
};

test.beforeEach(async ({ page }) => {
  // Arrange
  await resetDB(SeedScript.nlrcMultiple, __filename);

  accessToken = await getAccessToken();

  await patchProgramFspConfiguration({
    programId: programIdVisa,
    name: 'Intersolve-visa',
    body: updateProgramFspConfigurationDto,
    accessToken,
  });
  // Seed registration
  await seedRegistrations([registrationOCW1], programIdVisa);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdVisa,
    referenceId: registrationOCW1.referenceId,
    accessToken,
  });
  // Login
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login();
  // Navigate to debit card page
  const debitCardPage = new RegistrationDebitCardPage(page);
  await debitCardPage.goto(
    `/program/${programIdVisa}/registrations/${registrationId}/debit-cards`,
  );
});

test('User can link a debit card to a registration', async ({ page }) => {
  const debitCardPage = new RegistrationDebitCardPage(page);
  const linkCardButton = await debitCardPage.getLinkVisaCardButton();
  const replaceCardButton = await debitCardPage.getReplaceCardButton();

  await test.step('User can view link card button', async () => {
    await expect(linkCardButton).toBeVisible();
  });

  await test.step('User can link a visa debit card to the registration', async () => {
    await debitCardPage.linkVisaCard(oldVisaCardNumber);
    await debitCardPage.validateToastMessageAndClose(
      'Link Visa card to registration',
    );
    await expect(replaceCardButton).toBeVisible();
  });
});

test('User can successfully replace a debit card', async ({ page }) => {
  // Arrange
  await linkVisaCardOnSite({
    programId: programIdVisa,
    referenceId: registrationOCW1.referenceId,
    tokenCode: oldVisaCardNumber,
    accessToken,
  });
  // Act & Assert
  await test.step('Replace debit card', async () => {
    const debitCardPage = new RegistrationDebitCardPage(page);

    await debitCardPage.replaceVisaCard(newVisaCardNumber);
    await debitCardPage.validateToastMessageAndClose(
      'Link Visa card to registration',
    );
    await debitCardPage.closeLinkDebitCardModal();
    // The behaviour of the page right now is that FE does not refresh immediately and the page should be refreshed to get new and old card numbers
    // I think this should not work like that
    await page.reload();
    const currentDebitCardDataList =
      await debitCardPage.getCurrentDebitCardDataList();
    const substituteDebitCardDataList =
      await debitCardPage.getSubstituteDebitCardDataList();
    expect(currentDebitCardDataList['Card number']).toBe(newVisaCardNumber);
    expect(substituteDebitCardDataList['Card number']).toBe(oldVisaCardNumber);
  });
});
