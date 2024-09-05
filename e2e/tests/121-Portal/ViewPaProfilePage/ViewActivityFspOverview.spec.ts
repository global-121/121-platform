import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  updateFinancialServiceProvider,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { test } from '@playwright/test';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import FspName from '../../../../interfaces/Portal/src/app/enums/fsp-name.enum';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';
import Helpers from '../../../pages/Helpers/Helpers';

let accessToken: string;
const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const pageTitle = englishTranslations['registration-details'].pageTitle;
const fspChangeLable =
  englishTranslations['registration-details']['activity-overview'].activities[
    'fsp-change'
  ].label;
const oldValue =
  englishTranslations['registration-details']['activity-overview'].activities[
    'data-changes'
  ].old;
const newValue =
  englishTranslations['registration-details']['activity-overview'].activities[
    'data-changes'
  ].new;

test.beforeEach(async ({ page }) => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  await resetDB(SeedScript.nlrcMultiple);
  accessToken = await getAccessToken();
  await waitFor(2_000);

  // Arrange
  await importRegistrations(programIdVisa, [registrationVisa], accessToken);
  await awaitChangePaStatus(
    programIdVisa,
    [registrationVisa.referenceId],
    RegistrationStatusEnum.included,
    accessToken,
  );
  const paymentReferenceIds = [registrationVisa.referenceId];

  // Act
  await doPayment(
    programIdVisa,
    paymentNrVisa,
    amountVisa,
    paymentReferenceIds,
    accessToken,
  );

  await waitForPaymentTransactionsToComplete(
    programIdVisa,
    paymentReferenceIds,
    accessToken,
    3001,
    Object.values(StatusEnum),
  );

  await updateFinancialServiceProvider(
    programIdVisa,
    accessToken,
    paymentReferenceIds,
    FspName.intersolveVoucherPaper,
    '31600000000',
    'a',
    '2',
    '3',
    '1234CH',
    'Waddinxveen',
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27496] View Activity overview in FSP column on PA profile page', async ({
  page,
}) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await table.openFspProfile({ shouldIncludeVisa: false });
  });

  await test.step('Validate Status history tab on PA Activity Overview table', async () => {
    const userName =
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN ?? 'defaultUserName';
    await registration.validateHeaderToContainText(pageTitle);
    await registration.openActivityOverviewTab('All');
    await registration.validateChangeLogTile(
      fspChangeLable,
      userName,
      await Helpers.getTodaysDate(),
      oldValue,
      newValue,
    );
  });
});
