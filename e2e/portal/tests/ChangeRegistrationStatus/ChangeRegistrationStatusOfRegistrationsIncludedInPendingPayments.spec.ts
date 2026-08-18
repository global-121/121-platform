import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// @REVIEWER: I know... This thing is horrendous.
// I'd rather throw in fakerjs and generate random data, but for now this is what we have to work with.
const registrations = Array.from({ length: 10 }).map((_, i) => ({
  referenceId: `63e62864557597e${i + 1}d`,
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  fullName: [
    'Emma Smith',
    'Liam Brown',
    'Noah Taylor',
    'Ava Jones',
    'Mia Davis',
    'Luca White',
    'Zoe Clark',
    'Max Green',
    'Ivy Adams',
    'Finn Hall',
  ][i],
  phoneNumber: `1415523666${i + 1}`,
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: `1415523888${i + 1}`,
  addressStreet: 'Teststraat',
  addressHouseNumber: `${i + 1}`,
  addressHouseNumberAddition: '',
  addressPostalCode: `123${i + 1}AB`,
  addressCity: 'Stad',
}));

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdOCW,
    registrations,
  });
});

test('Pause registrations included in pending payments', async ({
  registrationsPage,
  tableComponent,
  paymentsPage,
  paymentPage,
  page,
}) => {
  const paymentUrl = `/en-GB/program/${programIdOCW}/payments/1`;

  // Prepare
  await test.step('Create a payment with 3 registrations', async () => {
    await page.goto(`/en-GB/program/${programIdOCW}/payments`);
    await paymentsPage.createPayment({
      names: [
        registrations[0].fullName,
        registrations[1].fullName,
        registrations[2].fullName,
      ],
    });

    await paymentPage.validatePaymentDetailsPageTitle();
  });

  // Act
  await test.step('Pause 3 registrations, 2 included in a pending payment', async () => {
    await page.goto(`/en-GB/program/${programIdOCW}/registrations`);
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationNames: [
        registrations[1].fullName,
        registrations[2].fullName,
        registrations[3].fullName,
      ],
      status: 'Pause',
    });
  });

  // Assert
  await test.step('Validate warning modal is shown with correct numbers', async () => {
    await registrationsPage.validateStatusChangeWarningModal({
      warningMessage:
        "You're about to pause 2 registration(s) that are included in a payment that's waiting for approval.",
      proceedMessage: 'Would you like to proceed with 3 registration(s)?',
      submit: true,
    });
  });

  await test.step('Validate payment table shows 2 registrations are paused', async () => {
    await page.goto(paymentUrl);
    await paymentPage.validatePaymentDetailsPageTitle();

    // @REVIEWER: Unfortunatly, becasue there are no unique identifiers for the table rows (No reg. name, id, referenceNumber)
    // we have to rely on the count of 'paused' statusses in the page. This is not ideal, but it works for now.
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'Paused',
      count: 2,
    });

    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'Included',
      count: 1,
    });
  });
});

test('Decline registrations included in pending payments', async ({
  registrationsPage,
  tableComponent,
  paymentsPage,
  paymentPage,
  page,
}) => {
  const paymentUrl = `/en-GB/program/${programIdOCW}/payments/1`;

  // Prepare
  await test.step('Create a payment with 3 registrations', async () => {
    await page.goto(`/en-GB/program/${programIdOCW}/payments`);
    await paymentsPage.createPayment({
      names: [
        registrations[0].fullName,
        registrations[1].fullName,
        registrations[2].fullName,
      ],
    });

    await paymentPage.validatePaymentDetailsPageTitle();
  });

  // Act
  await test.step('Decline 3 registrations, 2 included in a pending payment', async () => {
    await page.goto(`/en-GB/program/${programIdOCW}/registrations`);
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationNames: [
        registrations[1].fullName,
        registrations[2].fullName,
        registrations[3].fullName,
      ],
      status: 'Decline',
    });
  });

  // Assert
  await test.step('Validate warning modal is shown with correct numbers', async () => {
    await registrationsPage.validateStatusChangeWarningModal({
      warningMessage:
        "You're about to decline 2 registration(s) that are included in a payment that's waiting for approval.",
      proceedMessage: 'Would you like to proceed with 3 registration(s)?',
      submit: true,
    });
  });

  await test.step('Validate payment table shows 2 registrations are paused', async () => {
    await page.goto(paymentUrl);
    await paymentPage.validatePaymentDetailsPageTitle();

    // @REVIEWER: Unfortunatly, becasue there are no unique identifiers for the table rows (No reg. name, id, referenceNumber)
    // we have to rely on the count of 'paused' statusses in the page. This is not ideal, but it works for now.
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'Declined',
      count: 2,
    });

    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'Declined',
      count: 1,
    });
  });
});
