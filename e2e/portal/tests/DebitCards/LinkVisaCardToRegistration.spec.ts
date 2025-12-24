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
  seedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationOCW1 } from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationDebitCardPage from '@121-e2e/portal/pages/RegistrationDebitCardPage';

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
  ],
};

test.beforeEach(async () => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  accessToken = await getAccessToken();
});

test('User can link a debit card to a registration', async ({ page }) => {
  // Arrange
  await seedRegistrations([registrationOCW1], programIdVisa);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdVisa,
    referenceId: registrationOCW1.referenceId,
    accessToken,
  });

  await patchProgramFspConfiguration({
    programId: programIdVisa,
    name: 'Intersolve-visa',
    body: updateProgramFspConfigurationDto,
    accessToken,
  });

  await test.step('Login', async () => {
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login();
  });

  const debitCardPage = new RegistrationDebitCardPage(page);
  await debitCardPage.goto(
    `/program/${programIdVisa}/registrations/${registrationId}/debit-cards`,
  );

  await test.step('User can view link card button', async () => {
    const linkCardButton = await debitCardPage.getLinkCardButton();
    await expect(linkCardButton).toBeVisible();
  });
});
