import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsVoucher,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { getRegistrationIdByReferenceId } from '../../../../services/121-service/test/helpers/registration.helper';
import { getAccessToken } from '../../../../services/121-service/test/helpers/utility.helper';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsVoucher,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/payments`,
  });
});

test('Block start payment with duplicates', async ({
  page,
  paymentPage,
  paymentsPage,
  registrationPersonalInformationPage,
}) => {
  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentDetailsPageTitle();
    // also validate toast messages for just this 1 (random) FSP instead of for all
    await paymentPage.validateToastMessageAndClose('Payment created');
    await paymentPage.approvePayment();
    await paymentPage.validateToastMessageAndClose('Payment approved');
  });

  await test.step('Make registration duplicate', async () => {
    const accessToken = await getAccessToken();
    const registrationId0 = await getRegistrationIdByReferenceId({
      programId: programIdPV,
      accessToken,
      referenceId: registrationsVoucher[0].referenceId,
    });

    await registrationPersonalInformationPage.goto(
      `/program/${programIdPV}/registrations/${registrationId0}/personal-information`,
    );

    await registrationPersonalInformationPage.clickEditInformationButton();

    await registrationPersonalInformationPage.fillTextInput({
      textInputIdName: 'phoneNumber',
      textInputValue: registrationsVoucher[1].phoneNumber,
    });

    await registrationPersonalInformationPage.saveChanges();
    await registrationPersonalInformationPage.validateToastMessageAndClose(
      'Personal information edited successfully.',
    );
  });

  await test.step('Fail to start payment', async () => {
    await paymentPage.goto(`/program/${programIdPV}/payments/1`);

    await page.waitForTimeout(1000);

    await paymentPage.startPayment();
    await paymentPage.validateDuplicatesErrorDialog({
      duplicateCount: registrationsVoucher.length,
    });
  });
});
