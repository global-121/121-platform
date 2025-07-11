import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  amountVisa,
  paymentNrVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getMessageHistoryUntilX,
  importRegistrations,
  issueNewVisaCard,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Do succesful payment with FSP Visa Debit', () => {
  // Set WhatsApp-number for ALL tests in this suite only
  const registrationVisa = {
    ...registrationVisaDefault,
    whatsappPhoneNumber: registrationVisaDefault.phoneNumber,
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(2_000);
  });

  it('should succesfully pay-out Visa Debit', async () => {
    // Arrange
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    const doPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(TransactionStatusEnum.success);
  });

  it('should successfully load balance Visa Debit', async () => {
    // Arrange
    registrationVisa.fullName = 'succeed';
    await importRegistrations(programIdVisa, [registrationVisa], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds: [registrationVisa.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationVisa.referenceId];

    // Act
    // do 1st payment
    await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      payment: paymentNrVisa,
    });

    // do 2nd payment
    const doSecondPaymentResponse = await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa + 1,
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      payment: paymentNrVisa + 1,
    });

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentNr: paymentNrVisa + 1,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doSecondPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doSecondPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(TransactionStatusEnum.success);
  });

  it('should payout different amounts based on current balance and spend', async () => {
    // Arrange
    const testPaymentNumber = 2;
    registrationVisa.fullName = 'mock-current-balance-13000-mock-spent-1000';
    registrationVisa.paymentAmountMultiplier = 3;

    registrationOCW2.fullName = 'mock-current-balance-14000-mock-spent-1000';
    registrationOCW2.paymentAmountMultiplier = 3;

    registrationOCW3.fullName = 'success';
    registrationOCW3.paymentAmountMultiplier = 3;

    registrationOCW4.fullName = 'mock-current-balance-0-mock-spent-6000';
    registrationOCW4.paymentAmountMultiplier = 3;

    const registrations = [
      registrationVisa,
      registrationOCW2,
      registrationOCW3,
      registrationOCW4,
    ];

    const referenceIds = registrations.map((r) => r.referenceId);

    await importRegistrations(programIdVisa, registrations, accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdVisa,
      referenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    // Act
    // do 1st payment
    await doPayment({
      programId: programIdVisa,
      paymentNr: paymentNrVisa,
      amount: amountVisa,
      referenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: referenceIds,
      accessToken,
      maxWaitTimeMs: 6_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      payment: paymentNrVisa,
    });

    // Reissue card so both cards have a spend of 6000
    await issueNewVisaCard(
      programIdVisa,
      registrationOCW4.referenceId,
      accessToken,
    );
    await waitFor(2_000);

    await doPayment({
      programId: programIdVisa,
      paymentNr: testPaymentNumber,
      amount: amountVisa,
      referenceIds,
      accessToken,
    });

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds: referenceIds,
      accessToken,
      maxWaitTimeMs: 6_000,
      completeStatusses: Object.values(TransactionStatusEnum),
      payment: testPaymentNumber,
    });

    // Assert
    const transactionsResponse1 = await getTransactions({
      programId: programIdVisa,
      paymentNr: testPaymentNumber,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    // Waits until the 4th message is received
    const messagesHistoryPa1 = await getMessageHistoryUntilX(
      programIdVisa,
      registrationVisa.referenceId,
      accessToken,
      4,
    );

    const transactionsResponse2 = await getTransactions({
      programId: programIdVisa,
      paymentNr: testPaymentNumber,
      registrationReferenceId: registrationOCW2.referenceId,
      accessToken,
    });
    const messagesHistoryPa2 = await getMessageHistoryUntilX(
      programIdVisa,
      registrationOCW2.referenceId,
      accessToken,
      4,
    );
    const transactionsResponse3 = await getTransactions({
      programId: programIdVisa,
      paymentNr: testPaymentNumber,
      registrationReferenceId: registrationOCW3.referenceId,
      accessToken,
    });
    const transactionsResponse4 = await getTransactions({
      programId: programIdVisa,
      paymentNr: testPaymentNumber,
      registrationReferenceId: registrationOCW4.referenceId,
      accessToken,
    });

    const expectedCalculatedAmountPa1 = 150 - 13000 / 100 - 1000 / 100; // = 10
    expect(transactionsResponse1.body[0].amount).toBe(
      expectedCalculatedAmountPa1,
    );
    expect(transactionsResponse1.text).toContain(TransactionStatusEnum.success);
    // Validate for one message where amount is higher than 0 that it is send in a message
    expect(messagesHistoryPa1.body.map((msg) => msg.attributes.body)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`€${expectedCalculatedAmountPa1}`),
      ]),
    );

    const expectedCalculatedAmountPa2 = 150 - 14000 / 100 - 1000 / 100; // = 0
    expect(transactionsResponse2.body[0].amount).toBe(
      expectedCalculatedAmountPa2, // = 0 : A transaction of 0 is created
    );
    expect(transactionsResponse2.text).toContain(TransactionStatusEnum.success);
    // Validate for one message where amount is 0 that it still sends a message with the amount 0, so people will know they have to spend money earlier next months
    expect(messagesHistoryPa2.body.map((msg) => msg.attributes.body)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`€${expectedCalculatedAmountPa2}`),
      ]),
    );

    // should be able to payout the full amount
    expect(transactionsResponse3.body[0].amount).toBe(
      amountVisa * registrationOCW3.paymentAmountMultiplier,
    );
    expect(transactionsResponse3.text).toContain(TransactionStatusEnum.success);

    // Kyc requirement
    expect(transactionsResponse4.body[0].amount).toBe(
      // 150 - 6000 / 100 - 0, // = 90 maximum of 90 can be put on this card so we expect the amount to be 75
      75,
    );
    expect(transactionsResponse4.text).toContain(TransactionStatusEnum.success);
  });
});
