import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  amountVisa,
  programIdVisa,
  registrationVisa as registrationVisaDefault,
} from '@121-service/src/seed-data/mock/visa-card.data';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  doPayment,
  getTransactions,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getTransactionEventDescriptions,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Do payment with FSP Visa Debit and than retry it', () => {
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

  it('should successfully retry pay-out after create customer error', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
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
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
      paymentId,
    });

    // update PA
    await updateRegistration(
      programIdVisa,
      registrationVisa.referenceId,
      { fullName: 'succeed' },
      'automated test',
      accessToken,
    );

    // retry payment
    await retryPayment({
      programId: programIdVisa,
      paymentId,
      accessToken,
    });
    await waitFor(2_000);

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsResponse.text).toContain(TransactionStatusEnum.success);

    const transactionEventDescriptions = await getTransactionEventDescriptions({
      programId: programIdVisa,
      transactionId: transactionsResponse.body[0].id,
      accessToken,
    });
    expect(transactionEventDescriptions).toEqual([
      TransactionEventDescription.created,
      TransactionEventDescription.initiated,
      TransactionEventDescription.visaPaymentRequested,
      TransactionEventDescription.retry,
      TransactionEventDescription.visaPaymentRequested,
    ]);
  });

  it('should not multiply again on retry', async () => {
    // Arrange
    registrationVisa.fullName = 'mock-fail-create-customer';
    registrationVisa.paymentAmountMultiplier = 3;
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
      amount: amountVisa,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = doPaymentResponse.body.id;

    await waitForPaymentTransactionsToComplete({
      programId: programIdVisa,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
      paymentId,
    });

    // update PA
    await updateRegistration(
      programIdVisa,
      registrationVisa.referenceId,
      { fullName: 'succeed' },
      'automated test',
      accessToken,
    );

    // retry payment
    await retryPayment({
      programId: programIdVisa,
      paymentId,
      accessToken,
    });
    await waitFor(2_000);

    // Assert
    const transactionsResponse = await getTransactions({
      programId: programIdVisa,
      paymentId,
      registrationReferenceId: registrationVisa.referenceId,
      accessToken,
    });

    expect(transactionsResponse.body[0].amount).toBe(
      amountVisa * registrationVisa.paymentAmountMultiplier,
    );
    expect(transactionsResponse.text).toContain(TransactionStatusEnum.success);
  });
});
