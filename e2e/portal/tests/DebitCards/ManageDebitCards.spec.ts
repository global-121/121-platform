import { expect, test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getRegistrationIdByReferenceId,
  getVisaWalletsAndDetails,
  seedIncludedRegistrations,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationOCW1 } from '@121-service/test/registrations/pagination/pagination-data';

import DataListComponent from '@121-e2e/portal/components/DataListComponent';
import FormDialogComponent from '@121-e2e/portal/components/FormDialogComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationDebitCardPage from '@121-e2e/portal/pages/RegistrationDebitCardPage';

const programId = 3;
let registrationId: number;
let accessToken: string;
test.beforeEach(async ({}) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  accessToken = await getAccessToken();
});

test('User can view debit cards of a registration with a single active debit card', async ({
  page,
}) => {
  // Prepare data - seed a registration with a payment to ensure they have a card
  await seedPaidRegistrations({ registrations: [registrationOCW1], programId });
  registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId: registrationOCW1.referenceId,
    accessToken,
  });

  const walletResponse = await getVisaWalletsAndDetails(
    programId,
    registrationOCW1.referenceId,
    accessToken,
  );

  const maxToSpendPerMonth = walletResponse.body.maxToSpendPerMonth / 100;
  const spentThisMonthLabel = `Spent this month (max. EUR ${maxToSpendPerMonth})`;

  await test.step('Login', async () => {
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login();
  });

  const debitCardPage = new RegistrationDebitCardPage(page);
  await debitCardPage.goto(
    `/program/${programId}/registrations/${registrationId}/debit-cards`,
  );

  await test.step('User can view current debit card data', async () => {
    const currentDate = new Date();
    const currentDateString = format(currentDate, 'd MMMM yyyy');
    const expectedDebitCardData = {
      'Serial number': expect.any(String),
      'Card status': 'Active',
      'Current balance': '€25.00',
      [spentThisMonthLabel]: '€3.00',
      'Issued on': currentDateString,
      'Last used': currentDateString,
    };
    const debitCardData = await debitCardPage.getCurrentDebitCardDataList();
    expect(debitCardData).toMatchObject(expectedDebitCardData);
  });

  await test.step('User can view pause card button', async () => {
    const pauseCardButton = await debitCardPage.getPauseCardButton();
    await expect(pauseCardButton).toBeVisible();
  });

  await test.step('User can view replace card button', async () => {
    const replaceCardButton =
      await debitCardPage.getMainPageReplaceCardButton();
    await expect(replaceCardButton).toBeVisible();
  });
});

test('User does not find debit card of a person without payments', async ({
  page,
}) => {
  await seedIncludedRegistrations([registrationOCW1], programId, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId: registrationOCW1.referenceId,
    accessToken,
  });

  await test.step('Login', async () => {
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login();
  });

  const debitCardPage = new RegistrationDebitCardPage(page);

  await test.step('User can view debit card menu', async () => {
    await debitCardPage.goto(
      `/program/${programId}/registrations/${registrationId}/debit-cards`,
    );
    await expect(page.getByTestId('registration-menu')).toBeVisible();
  });

  await test.step('User can not view current debit card data', async () => {
    const debitCardData = await debitCardPage.getCurrentDebitCardElement();
    await expect(debitCardData).not.toBeVisible();
  });

  await test.step('User can not view pause card button', async () => {
    const pauseCardButton = await debitCardPage.getPauseCardButton();
    await expect(pauseCardButton).not.toBeVisible();
  });

  await test.step('User can not view replace card button', async () => {
    const replaceCardButton = await debitCardPage.getReplaceCardButton();
    await expect(replaceCardButton).not.toBeVisible();
  });
});

test('User can replace a debit card and view both new and old card', async ({
  page,
}) => {
  // Prepare data - seed a registration with a payment to ensure they have a card
  await seedPaidRegistrations({ registrations: [registrationOCW1], programId });
  registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId: registrationOCW1.referenceId,
    accessToken,
  });

  const walletResponse = await getVisaWalletsAndDetails(
    programId,
    registrationOCW1.referenceId,
    accessToken,
  );

  const maxToSpendPerMonth = walletResponse.body.maxToSpendPerMonth / 100;
  const spentThisMonthLabel = `Spent this month (max. EUR ${maxToSpendPerMonth})`;

  await test.step('Login', async () => {
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login();
  });

  const debitCardPage = new RegistrationDebitCardPage(page);
  await debitCardPage.goto(
    `/program/${programId}/registrations/${registrationId}/debit-cards`,
  );

  let initialCardData: Record<string, string>;
  await test.step('Save initial card details before replacement', async () => {
    // Capture the original card number to verify it appears in old cards later
    initialCardData = await debitCardPage.getCurrentDebitCardDataList();
  });

  await test.step('Replace the debit card', async () => {
    await (await debitCardPage.getMainPageReplaceCardButton()).click();
  });

  await test.step('Verify the confirmation dialog', async () => {
    const dialogLocator = page.locator('.p-dialog');

    const dialog = new FormDialogComponent(dialogLocator);
    await dialog.waitForVisible();
    // Assert
    expect(await dialog.getHeader()).toBe('Replace card');
    expect(await dialog.hasIcon('pi-refresh')).toBeTruthy();

    expect(
      await dialog.hasContent(`You're about to replace debit card`),
    ).toBeTruthy();
    expect(
      await dialog.hasContent(
        'This will block the current card and a new card will be issued',
      ),
    ).toBeTruthy();
    expect(
      await dialog.hasContent(initialCardData['Serial number']),
    ).toBeTruthy();
    expect(
      await dialog.hasContent(
        'A message will be sent to the registration about this update',
      ),
    );

    // Verify dialog buttons
    const cancelButton = await dialog.getButton('Cancel');
    await expect(cancelButton).toBeVisible();

    const confirmButton = await dialog.getButton('Request new card');
    await expect(confirmButton).toBeVisible();

    // Confirm the replacement
    await dialog.confirm('Request new card');
  });

  await test.step('Verify new active card details after replacement', async () => {
    // Verify the new active card exists
    const newCardData = await debitCardPage.getCurrentDebitCardDataList();
    expect(newCardData['Card number']).not.toBe(
      initialCardData['Serial number'],
    );

    // Verify all other field that should match the initial card
    expect(newCardData).toMatchObject({
      'Issued on': initialCardData['Issued on'],
      'Card status': initialCardData['Card status'],
      'Last used': initialCardData['Last used'],
      'Current balance': initialCardData['Current balance'],
      [spentThisMonthLabel]: initialCardData[spentThisMonthLabel],
    });
  });

  await test.step('Verify old card details after replacement', async () => {
    const oldCardList = page.locator('[data-testid="old-card-list"]');
    await expect(oldCardList).toBeVisible();

    // Verify the accordion header contains the original card number
    const originalCardNumber = initialCardData['Serial number'];
    const accordionHeader = oldCardList.locator('p-accordion-header');

    await expect(accordionHeader).toContainText(`Old card:`);
    await expect(accordionHeader).toContainText(`${originalCardNumber}`);

    const statusChip = accordionHeader.locator('app-colored-chip');
    await expect(statusChip).toBeVisible();
    await expect(statusChip).toContainText('Substituted');

    // Click to expand the accordion
    await accordionHeader.click();
    const accordionContent = oldCardList.locator('p-accordion-content');
    await expect(accordionContent).toBeVisible();

    // Get data from the data list inside the accordion
    const dataList = accordionContent.locator('app-data-list');
    const oldCardDataComponent = new DataListComponent(dataList);
    const oldCardData = await oldCardDataComponent.getData();
    expect(oldCardData).toMatchObject({
      Explanation: 'Card has been substituted due to re-issue',
      'Issued on': initialCardData['Issued on'],
    });
  });
});

test('User can pause and unpause a debit card', async ({ page }) => {
  // Prepare data - seed a registration with a payment to ensure they have a card
  await seedPaidRegistrations({ registrations: [registrationOCW1], programId });

  registrationId = await getRegistrationIdByReferenceId({
    programId,
    referenceId: registrationOCW1.referenceId,
    accessToken,
  });

  const walletResponse = await getVisaWalletsAndDetails(
    programId,
    registrationOCW1.referenceId,
    accessToken,
  );

  const maxToSpendPerMonth = walletResponse.body.maxToSpendPerMonth / 100;
  const spentThisMonthLabel = `Spent this month (max. EUR ${maxToSpendPerMonth})`;

  await test.step('Login', async () => {
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login();
  });

  const debitCardPage = new RegistrationDebitCardPage(page);
  await debitCardPage.goto(
    `/program/${programId}/registrations/${registrationId}/debit-cards`,
  );

  let initialCardData: Record<string, string>;
  await test.step('Get initial card details before pausing', async () => {
    // Capture the original card data to verify it's active
    initialCardData = await debitCardPage.getCurrentDebitCardDataList();
  });

  await test.step('Click the pause button', async () => {
    await (await debitCardPage.getPauseCardButton()).click();
  });

  await test.step('Verify the pause confirmation dialog', async () => {
    const dialogLocator = page.locator('.p-dialog');
    const dialog = new FormDialogComponent(dialogLocator);
    await dialog.waitForVisible();

    // Assert dialog content
    expect(await dialog.getHeader()).toBe('Pause card');
    expect(await dialog.hasIcon('pi-pause')).toBeTruthy();

    // Verify specific text content
    expect(
      await dialog.hasContent(`You're about to pause debit card`),
    ).toBeTruthy();
    expect(
      await dialog.hasContent(initialCardData['Serial number']),
    ).toBeTruthy();
    expect(
      await dialog.hasContent(
        'A message will be sent to the registration about this update',
      ),
    ).toBeTruthy();

    // Verify dialog buttons
    const cancelButton = await dialog.getButton('Cancel');
    await expect(cancelButton).toBeVisible();

    const confirmButton = await dialog.getButton('Pause card');
    await expect(confirmButton).toBeVisible();

    // Confirm the pause action
    await dialog.confirm('Pause card');
  });

  await test.step('Verify card is paused', async () => {
    // Get updated card data
    const pausedCardData = await debitCardPage.getCurrentDebitCardDataList();

    // Verify card status changed to Paused
    expect(pausedCardData['Card status']).toBe('Paused');

    // Verify card number didn't change
    expect(pausedCardData['Serial number']).toBe(
      initialCardData['Serial number'],
    );

    // Verify other fields remain unchanged
    expect(pausedCardData).toMatchObject({
      'Issued on': initialCardData['Issued on'],
      'Last used': initialCardData['Last used'],
      'Current balance': initialCardData['Current balance'],
      [spentThisMonthLabel]: initialCardData[spentThisMonthLabel],
    });

    // Verify the Pause button changed to Unpause
    const unpauseButton = await debitCardPage.getUnpauseCardButton();
    expect(unpauseButton).toBeTruthy();
    await expect(unpauseButton).toBeVisible();
  });

  // Step 2: Unpause the card
  await test.step('Unpause the debit card', async () => {
    await (await debitCardPage.getUnpauseCardButton()).click();
  });

  await test.step('Verify the unpause confirmation dialog', async () => {
    const dialogLocator = page.locator('.p-dialog');
    const dialog = new FormDialogComponent(dialogLocator);
    await dialog.waitForVisible();

    // Assert dialog content
    expect(await dialog.getHeader()).toBe('Unpause card');
    expect(await dialog.hasIcon('pi-play')).toBeTruthy();

    // Verify specific text content
    expect(
      await dialog.hasContent(`You're about to unpause debit card`),
    ).toBeTruthy();
    expect(
      await dialog.hasContent(initialCardData['Serial number']),
    ).toBeTruthy();
    expect(
      await dialog.hasContent(
        'A message will be sent to the registration about this update',
      ),
    ).toBeTruthy();

    // Verify dialog buttons
    const cancelButton = await dialog.getButton('Cancel');
    await expect(cancelButton).toBeVisible();

    const confirmButton = await dialog.getButton('Unpause card');
    await expect(confirmButton).toBeVisible();

    // Confirm the unpause action
    await dialog.confirm('Unpause card');
  });

  await test.step('Verify card is active again', async () => {
    // Get updated card data
    const unpausedCardData = await debitCardPage.getCurrentDebitCardDataList();

    // Verify card status changed back to Active
    expect(unpausedCardData['Card status']).toBe('Active');

    // Verify card number remained the same throughout the process
    expect(unpausedCardData['Card number']).toBe(
      initialCardData['Card number'],
    );

    // Verify the Pause button is back
    const pauseButton = await debitCardPage.getPauseCardButton();
    await expect(pauseButton).toBeVisible();
  });
});
