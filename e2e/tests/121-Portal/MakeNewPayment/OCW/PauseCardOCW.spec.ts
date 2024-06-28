import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import NavigationModule from '@121-e2e/pages/Navigation/NavigationModule';
import PhysicalCardOverview from '@121-e2e/pages/PhysicalCardOverview/PhysicalCardOverview';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { WalletCardStatus121 } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/wallet-status-121.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { AppRoutes } from '../../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../../interfaces/Portal/src/assets/i18n/en.json';

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

test('[28462] Pause Visa debit cards', async ({ page }) => {
  const table = new TableModule(page);
  const navigationModule = new NavigationModule(page);
  const physicalCard = new PhysicalCardOverview(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await navigationModule.navigateToProgramTab(paymentLabel);
    await table.openFspProfile({ shouldIncludeVisa: true });
  });

  await test.step('Should Pause Visa Card and details are presented correctly with status: Paused', async () => {
    await physicalCard.validateDebitCardStatus(
      physicalCardTitle,
      WalletCardStatus121.Active,
    );
    await physicalCard.pauseVisaDebitCard();
    await physicalCard.validateDebitCardStatus(
      physicalCardTitle,
      WalletCardStatus121.Paused,
    );
    await physicalCard.unPauseVisaDebitCard();
    await physicalCard.validateDebitCardStatus(
      physicalCardTitle,
      WalletCardStatus121.Active,
    );
  });
});
