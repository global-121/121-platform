import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const orderDebitCardOrder = {
  noOfCards: '100',
  addressPostalCode: '2593 HT',
  addressCity: 'Den Haag',
  addressStreet: 'Anna van Saksenlaan',
  addressHouseNumber: '50',
  addressHouseNumberAddition: 'K',
  phoneNumber: '123456789',
  addressee: 'John Doe',
};

test('Should not be able to order debit cards when card distribution by mail is enabled', async ({
  resetDBAndSeedRegistrations,
  programMonitoringPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/monitoring/dashboard`,
  });

  await test.step("Navigate to monitoring's 'Debit Cards' tab and order cards", async () => {
    await programMonitoringPage.selectTab({ tabName: 'Debit Cards' });
    await programMonitoringPage.orderCards(orderDebitCardOrder);
  });

  await test.step('Verify that an error is shown', async () => {
    await programMonitoringPage.validateFormError({
      errorText:
        'Something went wrong: "Batch ordering Visa cards is only allowed when card distribution by mail is disabled."',
    });
  });
});

test('Should be able to order debit cards when card distribution by mail is disabled', async ({
  resetDBAndSeedRegistrations,
  programMonitoringPage,
  fspSettingsPage,
  page,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/settings/fsps`,
  });

  await test.step('Disable card distribution by mail', async () => {
    await fspSettingsPage.openEditFspConfigurationByName('Visa debit card');
    const cardDistributionSwitch = page.getByRole('switch', {
      name: '* Card distribution by mail',
    });
    await cardDistributionSwitch.click();
    await fspSettingsPage.saveReconfigurationButton.click();
  });

  await test.step("Navigate to monitoring's 'Debit Cards' tab and Order cards", async () => {
    await programMonitoringPage.goto(
      `/program/${programIdOCW}/monitoring/dashboard`,
    );
    await programMonitoringPage.selectTab({ tabName: 'Debit Cards' });
    await programMonitoringPage.orderCards(orderDebitCardOrder);
    await programMonitoringPage.validateToastMessage(
      'Debit cards ordered successfully',
    );
  });

  await test.step('Verify that the order is listed in the table', async () => {
    await programMonitoringPage.expectCardOrdersTableToContainOrder(
      orderDebitCardOrder,
    );
  });
});

test('Should not be able to see the Debit cards tab for programs without physical cards', async ({
  resetDBAndSeedRegistrations,
  programMonitoringPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/monitoring/dashboard`,
  });

  await test.step("Confirm that the 'Debit Cards' tab is not visible", async () => {
    await programMonitoringPage.confirmDebitCardsTabNotVisible();
  });
});

test('Should not be able to see the Debit cards tab for programs without FspDebitCardOrderREAD permission', async ({
  resetDBAndSeedRegistrations,
  programMonitoringPage,
}) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/monitoring/dashboard`,
    userCredentials: {
      username: env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW ?? '',
      password: env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW ?? '',
    },
  });

  await test.step("Confirm that the 'Debit Cards' tab is not visible", async () => {
    await programMonitoringPage.confirmDebitCardsTabNotVisible();
  });
});
