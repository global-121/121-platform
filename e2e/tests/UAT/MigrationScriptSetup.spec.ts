import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PhysicalCardOverview from '@121-e2e/pages/PhysicalCardOverview/PhysicalCardOverview';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  registrationsOCW,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { v4 as uuid } from 'uuid';
import englishTranslations from '../../../interfaces/Portal/src/assets/i18n/en.json';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;
  for (const registrationOCW of registrationsOCW) {
    registrationOCW.referenceId = uuid();
  }

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  const programIdPV = 2;
  const pvProgramId = programIdPV;
  for (const registrationPV of registrationsPV) {
    registrationPV.referenceId = uuid();
  }

  await seedPaidRegistrations(registrationsPV, pvProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('Setup migration enviroment', async ({ page }) => {
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const physicalCard = new PhysicalCardOverview(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
    await navigationModule.navigateToProgramTab(
      englishTranslations.page.program.tab.payment.label,
    );
    await table.clickOnPaNumber(2);
  });

  await test.step('Should validate all possible card statuses at once: Paused, Active, Blocked/Substitued for OCW programme', async () => {
    await physicalCard.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Active,
    );
    await physicalCard.issueNewVisaDebitCard();
    // FOR NOW STATUS SHOULD BE BLOCKED BUT AFTER NEW CHANGES ARE APPLIED THIS SHOULD BE CHANGED INTO "SUBSTITUTED"
    await physicalCard.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Blocked,
    );
    await physicalCard.pauseVisaDebitCard();
    await physicalCard.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Paused,
    );
  });

  await test.step('Should validate all possible card statuses at once: Paused, Active, Blocked/Substitued for PV programme', async () => {
    await page.goto('/home');
    await homePage.navigateToProgramme(NLRCProgramPV.titlePortal.en);
    await navigationModule.navigateToProgramTab(
      englishTranslations.page.program.tab.payment.label,
    );
    await table.clickOnPaNumber(1);
    await physicalCard.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Active,
    );
    await physicalCard.issueNewVisaDebitCard();
    // FOR NOW STATUS SHOULD BE BLOCKED BUT AFTER NEW CHANGES ARE APPLIED THIS SHOULD BE CHANGED INTO "SUBSTITUTED"
    await physicalCard.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Blocked,
    );
    await physicalCard.pauseVisaDebitCard();
    await physicalCard.validateDebitCardStatus(
      englishTranslations['registration-details']['physical-cards-overview']
        .title,
      WalletCardStatus121.Paused,
    );
  });
});
