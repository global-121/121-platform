import { expect } from '@playwright/test';

import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getRegistrationIdByReferenceId } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
} from '@121-service/test/registrations/pagination/pagination-data';

import FormDialogComponent from '@121-e2e/portal/components/FormDialogComponent';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const closedCardRegistration = {
  ...registrationOCW2,
  fullName: `mock-fail-get-card-${IntersolveVisaCardStatus.CardClosed}`,
};

test.describe('Close debit card', () => {
  let accessToken: string;

  test.beforeAll(async ({ onlyResetAndSeedRegistrations }) => {
    await onlyResetAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationOCW1, closedCardRegistration],
      programId: programIdOCW,
      seedPaidRegistrations: true,
    });
    accessToken = await getAccessToken();
  });

  test.beforeEach(async ({ login }) => {
    await login();
  });

  test('User can close a debit card and export the refunded debit cards', async ({
    page,
    registrationDebitCardPage,
    paymentsPage,
    exportDataComponent,
  }) => {
    const registrationId = await getRegistrationIdByReferenceId({
      programId: programIdOCW,
      referenceId: registrationOCW1.referenceId,
      accessToken,
    });

    await registrationDebitCardPage.goto(
      `/program/${programIdOCW}/registrations/${registrationId}/debit-cards`,
    );

    await test.step('Close the debit card', async () => {
      const closeCardButton =
        await registrationDebitCardPage.getCloseCardButton();
      await closeCardButton.click();

      const dialog = new FormDialogComponent(page.locator('.p-dialog'));
      await dialog.waitForVisible();
      await dialog.confirm('Close card');
    });

    // We intentionally do NOT re-assert the card state on the debit card page.
    // The portal triggers a PATCH that re-reads from the stateless Intersolve mock service,
    // which would overwrite the "closed" state we just wrote. Instead, we validate
    // persistence via the "Refunded debit cards" export, which reads directly from
    // the database.
    await test.step('Export refunded debit cards and validate XLSX file', async () => {
      await paymentsPage.goto(`/program/${programIdOCW}/payments`);
      await paymentsPage.selectPaymentExportOption({
        option: 'Refunded debit cards',
      });

      await exportDataComponent.exportAndAssertData({
        exactRowCount: 1,
        excludedColumns: ['cardNumber', 'closedDate'],
      });
    });
  });

  test('User sees the correct card status and available actions for a closed card', async ({
    registrationDebitCardPage,
  }) => {
    const registrationId = await getRegistrationIdByReferenceId({
      programId: programIdOCW,
      referenceId: closedCardRegistration.referenceId,
      accessToken,
    });
    // Due to the fullname of this registration, the Intersolve mock service will return a "Closed" card status. This allows us to validate that the portal correctly displays the card status and available actions for a closed card.

    await registrationDebitCardPage.goto(
      `/program/${programIdOCW}/registrations/${registrationId}/debit-cards`,
    );

    const cardData =
      await registrationDebitCardPage.getCurrentDebitCardDataList();
    expect(cardData['Card status']).toBe('Closed');

    await expect(
      await registrationDebitCardPage.getMainPageReplaceCardButton(),
    ).toBeVisible();

    await expect(
      await registrationDebitCardPage.getPauseCardButton(),
    ).not.toBeVisible();
    await expect(
      await registrationDebitCardPage.getUnpauseCardButton(),
    ).not.toBeVisible();
    await expect(
      await registrationDebitCardPage.getCloseCardButton(),
    ).not.toBeVisible();
  });
});
