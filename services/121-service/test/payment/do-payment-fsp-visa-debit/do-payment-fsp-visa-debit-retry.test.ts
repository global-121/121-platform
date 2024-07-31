import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { StatusEnum } from '@121-service/src/shared/enum/status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getTransactions,
  retryPayment,
} from '@121-service/test/helpers/program.helper';
import {
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { HttpStatus } from '@nestjs/common';

describe('Do payment with FSP Visa Debit and than retry it', () => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should successfully retry pay-out after create customer error', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    // Act
    const doPaymentResponse = await seedPaidRegistrations(
      [registrationVisa],
      programIdVisa,
    );

    // update PA
    await updateRegistration(
      programIdVisa,
      registrationVisa.referenceId,
      { fullName: 'succeed' },
      'automated test',
      accessToken,
    );

    // retry payment
    await retryPayment(programIdVisa, paymentNrVisa, accessToken);
    await waitFor(2_000);

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(1);
    expect(transactionsResponse.text).toContain(StatusEnum.success);
  });

  it('should not multiply again on retry', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    registrationVisa.paymentAmountMultiplier = 3;
    // Act
    await seedPaidRegistrations([registrationVisa], programIdVisa);

    // update PA
    await updateRegistration(
      programIdVisa,
      registrationVisa.referenceId,
      { fullName: 'succeed' },
      'automated test',
      accessToken,
    );

    // retry payment
    await retryPayment(programIdVisa, paymentNrVisa, accessToken);
    await waitFor(2_000);

    // Assert
    const transactionsResponse = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    expect(transactionsResponse.body[0].amount).toBe(
      amountVisa * registrationVisa.paymentAmountMultiplier,
    );
    expect(transactionsResponse.text).toContain(StatusEnum.success);
  });

  it('should store calculated amount on fail and use calculated amount on retry', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    registrationVisa.paymentAmountMultiplier = 8; // This results in 25 * 8 = 200
    // Act
    await seedPaidRegistrations([registrationVisa], programIdVisa);

    const transactionsResponseError = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    // update PA
    await updateRegistration(
      programIdVisa,
      registrationVisa.referenceId,
      { fullName: 'great success' },
      'automated test',
      accessToken,
    );

    // retry payment
    await retryPayment(programIdVisa, paymentNrVisa, accessToken);
    await waitFor(2_000);

    // Assert
    const transactionsResponseSuccess = await getTransactions(
      programIdVisa,
      paymentNrVisa,
      registrationVisa.referenceId,
      accessToken,
    );

    // This should all have the calculated amount of 150 as 200 is over kyc limit
    expect(transactionsResponseError.body[0].amount).toBe(150);
    expect(transactionsResponseError.text).toContain(StatusEnum.error);
    expect(transactionsResponseSuccess.body[0].amount).toBe(150);
    expect(transactionsResponseSuccess.text).toContain(StatusEnum.success);
  });
});
