import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPaymentAndWaitForCompletion } from '@121-service/test/helpers/registration.helper';
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
    navigateToPage: `/program/${programIdOCW}/registrations`,
  });
});

test('ExportPayments', async ({
  paymentsPage,
  exportDataComponent,
  accessToken,
}) => {
  await test.step('Do payments', async () => {
    for (let i = 0; i < 4; i++) {
      await doPaymentAndWaitForCompletion({
        programId: programIdOCW,
        referenceIds: registrationsOCW.map((reg) => reg.referenceId),
        transferValue: 25,
        accessToken,
      });
    }
    await paymentsPage.navigateToProgramPage('Payments');
  });

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
        expect(registrationProgramIdIndex).toBeGreaterThan(-1);
        const aId = a[registrationProgramIdIndex];
        const bId = b[registrationProgramIdIndex];

        if (aId !== bId) {
          return parseInt(aId, 10) - parseInt(bId, 10);
        }

        const paymentIdIndex = headerCells.indexOf('paymentId');
        expect(paymentIdIndex).toBeGreaterThan(-1);
        const aPaymentId = a[paymentIdIndex];
        const bPaymentId = b[paymentIdIndex];

        return parseInt(aPaymentId, 10) - parseInt(bPaymentId, 10);
      },
    });
  });
});

test('View available actions for admin', async ({ page, paymentsPage }) => {
  await test.step('Validate export options', async () => {
    await paymentsPage.navigateToProgramPage('Payments');
    await page.waitForTimeout(200); // wait for the export options to be rendered
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

test('View available actions for a "view only" user', async ({
  paymentsPage,
  homePage,
  loginPage,
}) => {
  await homePage.selectAccountOption('Logout');
  await loginPage.login(
    env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
    env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
  );

  await test.step('Validate hidden buttons', async () => {
    await paymentsPage.exportButton.waitFor({ state: 'hidden' });
    await paymentsPage.createNewPaymentButton.waitFor({ state: 'hidden' });
  });
});
