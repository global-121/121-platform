import { HttpStatus } from '@nestjs/common';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createAndStartPayment,
  createPayment,
  getPaymentEvents,
  getTransactions,
  startPayment,
  waitForPaymentNotInProgress,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getRegistrations,
  seedIncludedRegistrations,
  waitForRegistrationToHaveUpdatedPaymentCount,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Start and create a payment separately', () => {
  let accessToken: string;
  const programId = programIdPV;
  const transferValue = 25;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should set registration to complete on payment start when maxPayments is reached', async () => {
    // Arrange
    const registrationAh = { ...registrationPV5, maxPayments: 1 };
    await seedIncludedRegistrations([registrationAh], programId, accessToken);
    const paymentReferenceIds = [registrationAh.referenceId];

    // Act 1 - create payment
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = createPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 20_000,
      completeStatusses: [TransactionStatusEnum.created],
    });

    // Assert 1 - before starting payment
    const getTransactionsBeforeStartResponse = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId: registrationAh.referenceId,
      accessToken,
    });
    const transactionsBeforeStart = getTransactionsBeforeStartResponse.body;

    const registrations = await getRegistrations({
      programId,
      accessToken,
      filter: {
        'filter.referenceId': registrationAh.referenceId,
      },
    });
    const registrationBeforeStart = registrations.body.data[0];

    expect(createPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(createPaymentResponse.body.applicableCount).toBe(
      paymentReferenceIds.length,
    );
    expect(transactionsBeforeStart[0].status).toBe(
      TransactionStatusEnum.created,
    );
    expect(registrationBeforeStart!.status).toBe(
      RegistrationStatusEnum.included,
    );
    expect(registrationBeforeStart!.paymentCount).toBe(0);

    // Act 2 - start payment
    const startPaymentResponse = await startPayment({
      programId,
      paymentId,
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 20_000,
    });

    // Assert 2 - after payment
    const getTransactionsAfterStartResponse = await getTransactions({
      programId,
      paymentId,
      registrationReferenceId: registrationAh.referenceId,
      accessToken,
    });
    const transactionsAfterStart = getTransactionsAfterStartResponse.body;
    // Wait for registration to be updated
    const registrationAfterStart =
      await waitForRegistrationToHaveUpdatedPaymentCount({
        programId,
        referenceId: registrationAh.referenceId,
        expectedPaymentCount: 1,
        accessToken,
      });
    expect(startPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(transactionsAfterStart[0].status).toBe(
      TransactionStatusEnum.success,
    );
    expect(transactionsAfterStart[0].errorMessage).toBe(null);

    expect(registrationAfterStart!.status).toBe(
      RegistrationStatusEnum.completed,
    );
    expect(registrationAfterStart!.paymentCountRemaining).toBe(0);
    expect(registrationAfterStart!.paymentCount).toBe(1);
  });

  describe('payment start', () => {
    let paymentId: number;
    beforeEach(async () => {
      const registrations = [registrationPV5, registrationPV6];
      await seedIncludedRegistrations(registrations, programId, accessToken);
      // only create, not start yet
      const createPaymentResponse = await createPayment({
        programId,
        transferValue,
        referenceIds: registrations.map((r) => r.referenceId),
        accessToken,
      });
      paymentId = createPaymentResponse.body.id;
      await waitForPaymentTransactionsToComplete({
        programId,
        paymentReferenceIds: registrations.map((r) => r.referenceId),
        accessToken,
        maxWaitTimeMs: 20_000,
        completeStatusses: [TransactionStatusEnum.created],
      });

      // Make one registration non-included
      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.declined,
        accessToken,
      });
    });

    it('should not start transactions of non-included registrations', async () => {
      // Arrange > beforeEach

      // Act
      await startPayment({
        programId,
        paymentId,
        accessToken,
      });
      // Wait for payment not in progress anymore instead of using waitForPaymentTransactionsToComplete. As we cannot just wait for the other transaction to complete, as we should give the time in theory for the declined transaction to also process, even though the assertion is that it shouldn't.
      await waitForPaymentNotInProgress({
        programId,
        accessToken,
      });

      // await waitFor(1_000); /

      // Assert
      const getTransactionsResponse = await getTransactions({
        programId,
        paymentId,
        accessToken,
      });
      const transactions = getTransactionsResponse.body;
      const unstartedTransactions = transactions.filter(
        (t: any) => t.status === TransactionStatusEnum.created,
      );
      const startedTransactions = transactions.filter(
        (t: any) => t.status !== TransactionStatusEnum.created,
      );

      expect(unstartedTransactions.length).toBe(1);
      expect(startedTransactions.length).toBe(1);
    });

    it('should facilitate 2nd payment start when created transactions present', async () => {
      // Arrange > beforeEach
      // start first payment
      await startPayment({
        programId,
        paymentId,
        accessToken,
      });
      // only wait for the transaction of the included registration to complete
      await waitForPaymentTransactionsToComplete({
        programId,
        paymentReferenceIds: [registrationPV6].map((r) => r.referenceId),
        accessToken,
        maxWaitTimeMs: 10_000,
      });
      // include the other registration again
      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });

      // Act - Start payment again
      const startPaymentResponse = await startPayment({
        programId,
        paymentId,
        accessToken,
      });
      await waitForPaymentTransactionsToComplete({
        programId,
        paymentReferenceIds: [registrationPV5, registrationPV6].map(
          (r) => r.referenceId,
        ),
        accessToken,
        maxWaitTimeMs: 10_000,
      });

      // Assert
      expect(startPaymentResponse.status).toBe(HttpStatus.ACCEPTED);

      const getTransactionsResponse = await getTransactions({
        programId,
        paymentId,
        accessToken,
      });
      const transactions = getTransactionsResponse.body;
      const startedTransactions = transactions.filter(
        (t: any) => t.status !== TransactionStatusEnum.created,
      );
      expect(startedTransactions.length).toBe(2);

      const paymentEvents = await getPaymentEvents({
        programId,
        paymentId,
        accessToken,
      });
      const paymentStartedEvents = paymentEvents.body.data.filter(
        (e) => e.type === PaymentEvent.started,
      );
      expect(paymentStartedEvents.length).toBe(2); // two starts
    });
  });

  it('should not facilitate 2nd payment when no created transactions for included registrations left', async () => {
    // Arrange
    await seedIncludedRegistrations(
      [registrationPV5, registrationPV6],
      programId,
      accessToken,
    );
    const doPaymentResponse = await createAndStartPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5, registrationPV6].map(
        (r) => r.referenceId,
      ),
      accessToken,
    });
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationPV5, registrationPV6].map(
        (r) => r.referenceId,
      ),
      accessToken,
      maxWaitTimeMs: 10_000,
    });
    const paymentId = doPaymentResponse.body.id;

    // Act - try to start payment again
    const startPaymentResponse2 = await startPayment({
      programId,
      paymentId,
      accessToken,
    });

    // Assert
    expect(startPaymentResponse2.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
