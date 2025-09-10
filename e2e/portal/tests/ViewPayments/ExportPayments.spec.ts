import { expect, Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

import HomePage from '../../pages/HomePage';

const login = async ({
  page,
  email,
  password,
}: {
  page: Page;
  email?: string;
  password?: string;
}) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(email, password);
};

const navigateToPaymentsPage = async (paymentsPage: PaymentsPage) => {
  const projectTitle = 'NLRC OCW Program';
  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);
    await paymentsPage.navigateToProgramPage('Payments');
  });
};

const createFivePayments = async (paymentsPage: PaymentsPage) => {
  for (let i = 0; i < 5; i++) {
    await paymentsPage.createPayment();
    await paymentsPage.startPayment();
    await paymentsPage.navigateToProgramPage('Payments');
    await paymentsPage.dismissToast();
  }
};

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, OcwProgramId, accessToken);

  await login({
    page,
  });

  const paymentsPage = new PaymentsPage(page);

  await navigateToPaymentsPage(paymentsPage);

  await createFivePayments(paymentsPage);
});

test('[35621] ExportPayments', async () => {
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  await test.step('Validate export payment button', async () => {
    await paymentsPage.exportButton.waitFor({ state: 'visible' });
  });

  await test.step('Export and validate file', async () => {
    await paymentsPage.selectPaymentExportOption({
      option: 'Payments',
    });

    await exportDataComponent.exportAndAssertData({
      exactRowCount: 25, // defaults to export all payments, so 5 payments * 5 registrations
      excludedColumns: ['id', 'created', 'updated', 'paymentDate'],
      // Given that the payments are not consistently sorted,
      // we need to sort them by registrationProgramId and payment
      // to ensure the snapshot is stable.
      sortFunction: (a: string[], b: string[], headerCells: string[]) => {
        const registrationProgramIdIndex = headerCells.indexOf(
          'registrationProgramId',
        );
        const aId = a[registrationProgramIdIndex];
        const bId = b[registrationProgramIdIndex];

        if (aId !== bId) {
          return parseInt(aId, 10) - parseInt(bId, 10);
        }

        const paymentIdIndex = headerCells.indexOf('payment');
        const aPaymentId = a[paymentIdIndex];
        const bPaymentId = b[paymentIdIndex];

        return parseInt(aPaymentId, 10) - parseInt(bPaymentId, 10);
      },
    });
  });
});

test('[36125] View available actions for admin', async () => {
  const paymentsPage = new PaymentsPage(page);

  await test.step('Validate export options', async () => {
    await paymentsPage.exportButton.waitFor({ state: 'visible' });

    await paymentsPage.exportButton.click();

    const expectedMenuItems = [
      'Payments',
      'Unused vouchers',
      'Debit card usage',
    ];

    // This part is to wait for the menu items to be visible before asserting
    const menuItems = page.getByRole('menuitem');
    await expect(menuItems).toHaveText(expectedMenuItems);

    // This part is to assert the actual text content of the menu items, also ensures there are no extra items
    const exportOptions = await menuItems.all();
    const exportOptionsText = await Promise.all(
      exportOptions.map((option) => option.textContent()),
    );
    expect(exportOptionsText).toEqual(expectedMenuItems);
  });
});

test('[36126] View available actions for a "view only" user', async () => {
  const homePage = new HomePage(page);
  await homePage.selectAccountOption('Logout');

  await login({
    page,
    email: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
    password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
  });

  const paymentsPage = new PaymentsPage(page);

  await navigateToPaymentsPage(paymentsPage);

  await test.step('Validate hidden buttons', async () => {
    await paymentsPage.exportButton.waitFor({ state: 'hidden' });

    await paymentsPage.createPaymentButton.waitFor({ state: 'hidden' });
  });
});
