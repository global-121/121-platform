import { type Page, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  getRegistrationIdByReferenceId,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';

let registrationId: number;
const paymentReferenceId = [registrationPV5.referenceId];

let page: Page;
test.beforeAll(async ({ browser }) => {
  // Arrange once because tests don't mutate backend state.
  await resetDB(SeedScript.nlrcMultiple, __filename);
  page = await browser.newPage();

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });

  await doPayment({
    programId: 2,
    transferValue: 100,
    referenceIds: paymentReferenceId,
    accessToken,
  });

  await updateRegistration(
    2,
    registrationPV5.referenceId,
    {
      maxPayments: '2',
    },
    'automated test',
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login();
  const activityLogPage = new RegistrationActivityLogPage(page);
  await test.step('Navigate to registration activity log', async () => {
    await activityLogPage.goto(
      `/program/${programIdPV}/registrations/${registrationId}`,
    );
  });
});

test.afterEach(async () => {
  const tableComponent = new TableComponent(page);
  await tableComponent.clearAllFilters();
});

['Transaction', 'Message', 'Data change', 'Status update'].forEach(
  (activity) => {
    test(`[34461] Filter activity overview table by  ${activity}`, async ({}) => {
      const tableComponent = new TableComponent(page);

      // Act
      await test.step(`Filter activity log on "${activity}".`, async () => {
        await tableComponent.filterColumnByDropDownSelection({
          columnName: 'Activity',
          selection: activity,
        });
      });

      // Assert
      await test.step(`Validating whether "${activity}" is visible.`, async () => {
        await tableComponent.validateFirstLogActivity(activity);
      });
    });
  },
);
