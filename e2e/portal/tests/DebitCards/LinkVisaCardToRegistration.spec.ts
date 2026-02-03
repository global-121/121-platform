import { expect, test } from '@playwright/test';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
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

import FormDialogComponent from '@121-e2e/portal/components/FormDialogComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationDebitCardPage from '@121-e2e/portal/pages/RegistrationDebitCardPage';

const visaCardNumber = '1111222233334444555';
const visaCardNumberDashed = '1111-2222-3333-4444-555';
const newVisaCardNumber = '5555444433332222111';
const newVisaCardNumberDashed = '5555-4444-3333-2222-111';
const nonExistingVisaCardNumber = '3333444455556666777';
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

  await test.step('User can view link card button', async () => {
    await expect(linkCardButton).toBeVisible();
  });

  await test.step('User can link a visa debit card to the registration', async () => {
    await debitCardPage.linkVisaCard(visaCardNumber);
    await debitCardPage.validateToastMessageAndClose(
      'Visa card linked successfully',
    );

    const currentDebitCardDataList =
      await debitCardPage.getCurrentDebitCardDataList();
    expect(currentDebitCardDataList['Serial number']).toBe(
      visaCardNumberDashed,
    );
  });
});

test('User can successfully replace a debit card and gets error if he tries to link an already linked card', async ({
  page,
}) => {
  // Arrange
  await linkVisaCardOnSite({
    programId: programIdVisa,
    referenceId: registrationOCW1.referenceId,
    tokenCode: visaCardNumber,
    accessToken,
  });
  // Act & Assert
  await test.step('Replace debit card', async () => {
    const dialogLocator = page.locator('.p-dialog');

    const debitCardPage = new RegistrationDebitCardPage(page);
    const formDialog = new FormDialogComponent(dialogLocator);
    // Link already existing card to check error message
    await debitCardPage.clickMainPageReplaceCardButton();
    await debitCardPage.replaceVisaCard(visaCardNumber);
    await formDialog.hasContent(
      'The card number you entered is already linked to the current registration.',
    );
    await debitCardPage.goBackToLinkDebitCardModal();
    // Link new card
    await debitCardPage.replaceVisaCard(newVisaCardNumber);
    await debitCardPage.validateToastMessageAndClose(
      'Visa card linked successfully',
    );

    // The behaviour of the page right now is that FE does not refresh immediately and the page should be refreshed to get new and old card numbers
    // I think this should not work like that
    // await page.reload();
    const currentDebitCardDataList =
      await debitCardPage.getCurrentDebitCardDataList();
    const substituteDebitCardDataList =
      await debitCardPage.getSubstituteDebitCardDataList();
    console.log(
      '🚀 ~ substituteDebitCardDataList:',
      substituteDebitCardDataList,
    );
    expect(currentDebitCardDataList['Serial number']).toBe(
      newVisaCardNumberDashed,
    );
    expect(substituteDebitCardDataList['Serial number']).toBe(
      visaCardNumberDashed,
    );
  });
});

test('Error when linking non existing card', async ({ page }) => {
  const dialogLocator = page.locator('.p-dialog');

  const debitCardPage = new RegistrationDebitCardPage(page);
  const formDialog = new FormDialogComponent(dialogLocator);

  await debitCardPage.linkVisaCard(nonExistingVisaCardNumber);

  await formDialog.hasContent(
    'Card number not found. Please go back and check that the number is correct.',
  );
});
