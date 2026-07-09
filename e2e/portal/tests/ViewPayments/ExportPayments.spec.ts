import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPaymentAndWaitForCompletion } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    registrations: registrationsOCW,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('Export Payments', async ({ paymentsPage, exportDataComponent }) => {
  const accessToken = await getAccessToken();

  await test.step('Do payments', async () => {
    for (let i = 0; i < 4; i++) {
      await doPaymentAndWaitForCompletion({
        programId: programIdOCW,
        referenceIds: registrationsOCW.map((reg) => reg.referenceId),
        transferValue: 25,
        accessToken,
      });
    }
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
        expect(registrationProgramIdIndex).toBeGreaterThan(-1);
        const aId = a[registrationProgramIdIndex];
        const bId = b[registrationProgramIdIndex];

        if (aId !== bId) {
          return Number.parseInt(aId, 10) - Number.parseInt(bId, 10);
        }

        const paymentIdIndex = headerCells.indexOf('paymentId');
        expect(paymentIdIndex).toBeGreaterThan(-1);
        const aPaymentId = a[paymentIdIndex];
        const bPaymentId = b[paymentIdIndex];

        return (
          Number.parseInt(aPaymentId, 10) - Number.parseInt(bPaymentId, 10)
        );
      },
    });
  });
});

test('View available actions for admin', async ({ page, paymentsPage }) => {
  await test.step('Go to payments page', async () => {
    await page.goto(`/program/${programIdOCW}/payments`);
    await expect(paymentsPage.pageTitle).toBeVisible();
  });

  await test.step('Validate export options', async () => {
    await paymentsPage.exportButton.click();

    const expectedMenuItems = [
      'Payments',
      'Unused vouchers',
      'Debit card usage',
      'Refunded debit cards',
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

test('View available actions for a "view only" user', async ({
  paymentsPage,
  loginPage,
}) => {
  await test.step('Log in as view-only user', async () => {
    await paymentsPage.selectAccountOption('Logout');

    await loginPage.login({
      skipNavigateToLogin: true,
      skipUrlCheck: true,
      username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
    });
  });

  await test.step('Go to payments page', async () => {
    await paymentsPage.goto(`/program/${programIdOCW}/payments`);
    await expect(paymentsPage.pageTitle).toBeVisible();
  });

  await test.step('Validate hidden buttons', async () => {
    await expect(paymentsPage.exportButton).not.toBeVisible();
    await expect(paymentsPage.createNewPaymentButton).not.toBeVisible();
  });
});
