import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import NLRCProgramPV from '@121-service/seed-data/program/program-nlrc-pv.json';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;
  const pvProgramId = programIdPV;

  await seedPaidRegistrations(registrationsPV, pvProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28428] View Visa debit cards table', async ({ page }) => {
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(NLRCProgramPV.titlePortal.en);
    await navigationModule.navigateToProgramTab(
      englishTranslations.page.program.tab.payment.label,
    );
    await table.clickOnPaNumber(3);
  });

  await test.step('Should Re-Issue Visa Card and details are presented correctly with status: Active and Blocked/ Substituted', async () => {
    await registration.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Active,
    );
    await registration.issueNewVisaDebitCard();
    // FOR NOW STATUS SHOULD BE BLOCKED BUT AFTER NEW CHANGES ARE APPLIED THIS SHOULD BE CHANGED INTO "SUBSTITUTED"
    await registration.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Blocked,
    );
  });
});
