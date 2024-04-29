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
import { waitFor } from '@121-service/src/utils/waitFor.helper';
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

let accessToken: string;

test.beforeEach(async ({ page }) => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  await resetDB(SeedScript.nlrcMultiple);
  accessToken = await getAccessToken();
  await waitFor(2_000);

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

test('[27494] View Visa debit cards table', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.validateNumberOfActivePrograms(2);
    await homePage.navigateToProgramme(NLRCProgram.titlePaApp.en);
    await table.selectTable('Payment');
    await table.clickOnPaNumber(1);
  });

  await test.step('Should validate PA profile opened succesfully and Visa Card Details are presented correctly with status: Active', async () => {
    await registration.validatePaProfileOpened();
    await registration.validateDebitCardStatus('Active');
    await registration.issueNewVisaDebitCard();
    await registration.validateDebitCardStatus('Blocked');
  });
});
