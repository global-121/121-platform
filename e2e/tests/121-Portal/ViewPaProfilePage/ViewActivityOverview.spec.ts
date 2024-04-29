import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/seed-data/mock/visa-card.data';
import NLRCProgram from '@121-service/seed-data/program/program-nlrc-ocw.json';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { ProgramPhase } from '@121-service/src/shared/enum/program-phase.enum';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import {
  changePhase,
  doPayment,
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
import data from '../../../../../121-platform/interfaces/Portal/src/assets/i18n/en.json';
import Helpers from '../../../pages/Helpers/Helpers';

let accessToken: string;

test.beforeEach(async ({ page }) => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  await resetDB(SeedScript.nlrcMultiple);
  accessToken = await getAccessToken();

  await changePhase(
    programIdVisa,
    ProgramPhase.registrationValidation,
    accessToken,
  );
  await changePhase(programIdVisa, ProgramPhase.inclusion, accessToken);
  await changePhase(programIdVisa, ProgramPhase.payment, accessToken);

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

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27495] View Activity Overview on PA profile page', async ({ page }) => {
  const helpers = new Helpers();
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
    await table.selectTable('Payment');
    await table.clickOnPaNumber(1);
  });

  await test.step('Validate the "Status history" tab on the PA Activity Overview table', async () => {
    const userName =
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN ?? 'defaultUserName';

    await registration.validatePaProfileOpened();
    await registration.openActivityOverviewTab('Status history');
    await registration.validateChangeLogTile(
      data['registration-details']['activity-overview'].activities.status.label,
      userName,
      await helpers.getTodaysDate(),
      data['registration-details']['activity-overview'].activities[
        'data-changes'
      ].old,
      data['registration-details']['activity-overview'].activities[
        'data-changes'
      ].new,
    );
  });
});
