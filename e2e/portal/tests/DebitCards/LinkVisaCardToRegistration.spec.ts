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
} from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import { registrationOCW1 } from '@121-service/test/registrations/pagination/pagination-data';

import FormDialogComponent from '@121-e2e/portal/components/FormDialogComponent';
import {
  customSharedFixture as test,
  expect,
} from '@121-e2e/portal/fixtures/fixture';

const visaCardNumber = '1111222233334444555';
const visaCardNumberDashed = '1111-2222-3333-4444-555';
const newVisaCardNumber = '5555444433332222111';
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
      value: false,
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
    {
      name: FspConfigurationProperties.maxToSpendPerMonthInCents,
      value: 15000,
    },
  ],
};
test.describe('Link Visa card to registration', () => {
  test.beforeEach(
    async ({ resetDBAndSeedRegistrations, registrationDebitCardPage }) => {
      await resetDBAndSeedRegistrations({
        seedScript: SeedScript.nlrcMultiple,
        registrations: [registrationOCW1],
        programId: programIdVisa,
      });
      accessToken = await getAccessToken();
      // Get registration id by reference id to be able to navigate to debit card page for the registration and link visa cards
      registrationId = await getRegistrationIdByReferenceId({
        programId: programIdVisa,
        referenceId: registrationOCW1.referenceId,
        accessToken,
      });
      // Update program fsp configuration to set card distribution by mail to false to be able to link visa cards on the site
      await patchProgramFspConfiguration({
        programId: programIdVisa,
        name: 'Intersolve-visa',
        body: updateProgramFspConfigurationDto,
        accessToken,
      });
      // Navigate to debit card page
      await registrationDebitCardPage.goto(
        `/program/${programIdVisa}/registrations/${registrationId}/debit-cards`,
      );
    },
  );

  test('User can link a debit card to a registration', async ({
    registrationDebitCardPage,
  }) => {
    const linkCardButton =
      await registrationDebitCardPage.getLinkVisaCardButton();

    await test.step('User can view link card button', async () => {
      await expect(linkCardButton).toBeVisible();
    });

    await test.step('User can link a visa debit card to the registration', async () => {
      await registrationDebitCardPage.linkVisaCard(visaCardNumber);
      await registrationDebitCardPage.validateToastMessageAndClose(
        'Visa card linked successfully',
      );

      const currentDebitCardDataList =
        await registrationDebitCardPage.getCurrentDebitCardDataList();
      expect(currentDebitCardDataList['Serial number']).toBe(visaCardNumber);
    });
  });

  test('User can successfully replace a debit card and gets error if he tries to link an already linked card', async ({
    registrationDebitCardPage,
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
      const dialogLocator = registrationDebitCardPage.page.locator('.p-dialog');

      const formDialog = new FormDialogComponent(dialogLocator);
      // Link already existing card to check error message
      await registrationDebitCardPage.clickMainPageReplaceCardButton();
      await registrationDebitCardPage.replaceVisaCard(visaCardNumber);
      await formDialog.hasContent(
        'The card number you entered is already linked to the current registration.',
      );
      await registrationDebitCardPage.goBackToLinkDebitCardModal();
      // Link new card
      await registrationDebitCardPage.replaceVisaCard(newVisaCardNumber);
      await registrationDebitCardPage.validateToastMessageAndClose(
        'Visa card linked successfully',
      );

      // The behaviour of the page right now is that FE does not refresh immediately and the page should be refreshed to get new and old card numbers
      // I think this should not work like that
      // await page.reload();
      const currentDebitCardDataList =
        await registrationDebitCardPage.getCurrentDebitCardDataList();
      const substituteDebitCardDataList =
        await registrationDebitCardPage.getSubstituteDebitCardDataList();
      expect(currentDebitCardDataList['Serial number']).toBe(newVisaCardNumber);
      expect(substituteDebitCardDataList['Serial number']).toBe(
        visaCardNumberDashed,
      );
    });
  });

  test('Error when linking non existing card', async ({
    registrationDebitCardPage,
  }) => {
    const dialogLocator = registrationDebitCardPage.page.locator('.p-dialog');
    const formDialog = new FormDialogComponent(dialogLocator);

    await registrationDebitCardPage.linkVisaCard(nonExistingVisaCardNumber);

    await formDialog.hasContent(
      'Card number not found. Please go back and check that the number is correct.',
    );
  });
});
