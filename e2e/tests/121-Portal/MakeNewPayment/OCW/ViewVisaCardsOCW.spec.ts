import { test } from '@playwright/test';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { VisaCard121Status } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PhysicalCardOverview from '@121-e2e/pages/PhysicalCardOverview/PhysicalCardOverview';
import TableModule from '@121-e2e/pages/Table/TableModule';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const paymentLabel = englishTranslations.page.program.tab.payment.label;
const physicalCardTitle =
  englishTranslations['registration-details']['physical-cards-overview'].title;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28516] View Visa cards', async ({ page }) => {
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const physicalCard = new PhysicalCardOverview(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
    await table.openFspProfile({ shouldIncludeVisa: true });
  });

  await test.step('Should validate all possible card statuses at once: Paused, Active, Blocked/Substitued', async () => {
    await physicalCard.validateDebitCardStatus(
      physicalCardTitle,
      VisaCard121Status.Active,
    );
    await physicalCard.issueNewVisaDebitCard();
    // FOR NOW STATUS SHOULD BE BLOCKED BUT AFTER NEW CHANGES ARE APPLIED THIS SHOULD BE CHANGED INTO "SUBSTITUTED"
    await physicalCard.validateDebitCardStatus(
      physicalCardTitle,
      VisaCard121Status.Substituted,
    );
    await physicalCard.pauseVisaDebitCard();
    await physicalCard.validateDebitCardStatus(
      physicalCardTitle,
      VisaCard121Status.Paused,
    );
  });
});
