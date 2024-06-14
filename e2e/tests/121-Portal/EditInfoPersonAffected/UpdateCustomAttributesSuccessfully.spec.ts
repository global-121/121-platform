import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';
import {
  startEnvironment,
  stopEnvironment,
} from '../../../parallel_test_containers/testContainer_compose';

const dynamicBaseURL = test.extend<{ baseURL: string }>({
  // Define the modifier function
  baseURL: async ({}, use: (url: string) => Promise<void>) => {
    // Your logic here
    // const dynamicURL = 'http://example.com'; // Replace with your logic to generate the dynamic URL
    const port = await startEnvironment();
    const dynamicURL = `http://localhost:${port}`;
    await use(dynamicURL);
  },
});

// dynamicBaseURL.beforeAll(async () => {
//   // const port = await startEnvironment();
//   // //need to wait for portal is ready
//   // // const iportal =
//   // //   baseURL?.replace('8088', String(port)) || process.env.BASE_URL;
//   // // console.log(baseURL);
//   // let iportal=`http://localhost:${port}`;
//   // // baseURL = iportal;
//   // if (process.env.BASE_URL) {
//   //    process.env.BASE_URL=iportal;
//   }
//   console.log(iportal);
// });

dynamicBaseURL.afterAll(async () => {
  await stopEnvironment();
});

dynamicBaseURL.beforeEach(async ({ page, baseURL }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);
  await page.goto(baseURL);
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

dynamicBaseURL(
  '[28043] Update custom attributes successfully',
  async ({ page }) => {
    const table = new TableModule(page);
    const homePage = new HomePage(page);
    const registration = new RegistrationDetails(page);
    let oldAmount = '';

    await dynamicBaseURL.step('Navigate to PA table', async () => {
      await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
    });

    await dynamicBaseURL.step('Open information pop-up', async () => {
      await table.openPaPersonalInformation({});
    });

    await dynamicBaseURL.step('Update payment amount multiplier', async () => {
      oldAmount = await registration.updatepaymentAmountMultiplier({
        saveButtonName: englishTranslations.common.save,
        okButtonName: englishTranslations.common.ok,
      });
    });

    await dynamicBaseURL.step(
      'navigate to PA profile page in data changes table',
      async () => {
        await page.reload();
        await table.clickOnPaNumber(1);
      },
    );

    await dynamicBaseURL.step(
      'Validate the "Payments" tab on the PA Activity Overview table to Contain Payment notifications, correct status, userName and date',
      async () => {
        await registration.validateHeaderToContainText(
          englishTranslations['registration-details'].pageTitle,
        );
        await registration.openActivityOverviewTab('Data changes');
        await registration.validateDataChangesTab({
          dataChangesLabel:
            englishTranslations['registration-details']['activity-overview']
              .activities['data-changes'].label,
          oldValue: oldAmount,
          newValue: String(Number(oldAmount) + 1),
        });
      },
    );
  },
);
