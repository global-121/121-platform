import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { PaymentEventDataDto } from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventInterface } from '@121-service/src/payments/transactions/transaction-events/dto/transaction-event-data.dto';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  registrationNotScopedPv,
  registrationScopedTurkanaNorthPv,
} from '@121-service/test/fixtures/scoped-registrations';
import {
  createAndStartPayment,
  createPayment,
  getPaymentEvents,
  getPayments,
  getProgramPaymentsStatus,
  getTransactions,
  retryPayment,
  startPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  doPaymentAndWaitForCompletion,
  getTransactionEvents,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

const transferValue = 25;

// const function to validate whether payement are in progress for multiple endpoints
const getPaymentProgressStatusForMultipleEndpoints = async ({
  programId,
  accessToken,
  paymentId,
}: {
  programId: number;
  accessToken: string;
  paymentId: number;
}): Promise<{
  paymentIsInProgress: boolean;
  createPaymentBlocked: boolean;
  startPaymentBlocked: boolean;
  retryPaymentBlocked: boolean;
}> => {
  const [
    createPaymentResponse,
    startPaymentResponse,
    retryPaymentResponse,
    paymentsStatusResponse,
  ] = await Promise.all([
    createPayment({
      programId,
      transferValue,
      accessToken,
    }),
    startPayment({ programId, paymentId, accessToken }),
    retryPayment({
      programId,
      paymentId,
      accessToken,
    }),
    getProgramPaymentsStatus(programId, accessToken),
  ]);

  const inProgressFromPaymentsStatus = paymentsStatusResponse.body.inProgress;

  const is4xxStatus = (status: number) => status >= 400 && status < 500;
  return {
    paymentIsInProgress: inProgressFromPaymentsStatus,
    createPaymentBlocked: is4xxStatus(createPaymentResponse.status),
    startPaymentBlocked: is4xxStatus(startPaymentResponse.status),
    retryPaymentBlocked: is4xxStatus(retryPaymentResponse.status),
  };
};

// 5 registration for PV
const registrationsPV = [
  registrationNotScopedPv,
  registrationScopedTurkanaNorthPv,
];

describe('Payment in progress', () => {
  let accessToken: string;
  const registrationReferenceIdsPV = registrationsPV.map((r) => r.referenceId);
  const registrationReferenceIdsOCW = registrationsOCW.map(
    (r) => r.referenceId,
  );

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);

    accessToken = await getAccessToken();

    await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);
  });

  it('should not be in progress after payment is completed', async () => {
    // Arrange
    await seedIncludedRegistrations(
      registrationsOCW,
      programIdOCW,
      accessToken,
    );

    // We do a payment here and wait for it to complete
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdPV,
      transferValue,
      referenceIds: registrationReferenceIdsPV,
      accessToken,
    });
    const paymentIdPvFirst = doPaymentResponse.body.id;
    await waitForPaymentTransactionsToComplete({
      programId: programIdPV,
      paymentReferenceIds: registrationReferenceIdsPV,
      accessToken,
      maxWaitTimeMs: 10_000,
      paymentId: paymentIdPvFirst,
    });

    // Act
    const getProgramPaymentsPvResult = (
      await getProgramPaymentsStatus(programIdPV, accessToken)
    ).body;
    const getProgramPaymentsOcwResult = (
      await getProgramPaymentsStatus(programIdOCW, accessToken)
    ).body;

    const doPaymentPvResultPaymentNext = await createAndStartPayment({
      programId: programIdPV,
      transferValue,
      referenceIds: [],
      accessToken,
    });
    const paymentIdPvNext = doPaymentPvResultPaymentNext.body.id;

    const doPaymentOcwResultPaymentNext = await createAndStartPayment({
      programId: programIdOCW,
      transferValue,
      referenceIds: [],
      accessToken,
    });

    const paymentIdOcw = doPaymentOcwResultPaymentNext.body.id;

    // Assert
    expect(getProgramPaymentsPvResult.inProgress).toBe(false);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    expect(doPaymentPvResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete({
      programId: programIdPV,
      paymentReferenceIds: registrationReferenceIdsPV,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: paymentIdPvNext,
    });
    await waitForPaymentTransactionsToComplete({
      programId: programIdOCW,
      paymentReferenceIds: registrationReferenceIdsOCW,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: paymentIdOcw,
    });
  });

  describe('payment action should happen only once when triggered concurrently', () => {
    const concurrentRequestsCount = 5;

    it('should only create one payment', async () => {
      // Act
      const paymentPromises: ReturnType<typeof createPayment>[] = [];
      for (let i = 0; i < concurrentRequestsCount; i++) {
        paymentPromises.push(
          createPayment({
            programId: programIdPV,
            transferValue,
            accessToken,
          }),
        );
      }
      const paymentResponses = await Promise.all(paymentPromises);
      const createdPayments = paymentResponses.filter(
        (res) => res.status === HttpStatus.ACCEPTED,
      );
      const blockedPayments = paymentResponses.filter(
        (res) => res.status === HttpStatus.BAD_REQUEST,
      );

      const payments = await getPayments(programIdPV, accessToken);
      const nrOfPayments = payments.body.length;

      // Assert
      expect(createdPayments.length).toBe(1);
      expect(blockedPayments.length).toBe(4);
      expect(nrOfPayments).toBe(1);
    });

    it('should only start payment once', async () => {
      // Arrange
      const paymentId = (
        await createPayment({
          programId: programIdPV,
          transferValue,
          accessToken,
        })
      ).body.id;

      // Act
      const startPaymentPromises: ReturnType<typeof startPayment>[] = [];
      for (let i = 0; i < concurrentRequestsCount; i++) {
        startPaymentPromises.push(
          startPayment({ programId: programIdPV, paymentId, accessToken }),
        );
      }
      const startPaymentResponses = await Promise.all(startPaymentPromises);
      const startedPayments = startPaymentResponses.filter(
        (res) => res.status === HttpStatus.ACCEPTED,
      );
      const blockedPayments = startPaymentResponses.filter(
        (res) => res.status === HttpStatus.BAD_REQUEST,
      );

      await waitForPaymentTransactionsToComplete({
        programId: programIdPV,
        paymentReferenceIds: registrationReferenceIdsPV,
        accessToken,
        maxWaitTimeMs: 30_000,
        paymentId,
      });

      const paymentEvents = await getPaymentEvents({
        programId: programIdPV,
        paymentId,
        accessToken,
      });

      const startEvents = paymentEvents.body.data.filter(
        (event: PaymentEventDataDto) => event.type === PaymentEvent.started,
      );

      // Assert
      expect(startedPayments.length).toBe(1);
      expect(blockedPayments.length).toBe(4);
      expect(startEvents.length).toBe(1);
    });

    it('should only retry a payment once', async () => {
      // Arrange
      // update whatsapp numbers to ensure failed transaction
      for (const registration of registrationsPV) {
        await updateRegistration(
          programIdPV,
          registration.referenceId,
          {
            whatsappPhoneNumber: '15005550001',
            programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
          },
          'test',
          accessToken,
        );
      }

      const paymentId = await doPaymentAndWaitForCompletion({
        programId: programIdPV,
        transferValue,
        accessToken,
        referenceIds: registrationReferenceIdsPV,
        completeStatuses: [
          TransactionStatusEnum.error,
          TransactionStatusEnum.success,
        ],
      });

      // Change programFspConfigurationName back so it the retry is successful
      for (const registration of registrationsPV) {
        await updateRegistration(
          programIdPV,
          registration.referenceId,
          {
            programFspConfigurationName:
              registration.programFspConfigurationName,
          },
          'test',
          accessToken,
        );
      }

      // Act
      const retryPaymentPromises: ReturnType<typeof retryPayment>[] = [];
      for (let i = 0; i < concurrentRequestsCount; i++) {
        retryPaymentPromises.push(
          retryPayment({
            programId: programIdPV,
            paymentId,
            accessToken,
            referenceIds: registrationReferenceIdsPV,
          }),
        );
      }
      const retryPaymentResponses = await Promise.all(retryPaymentPromises);
      const retriedPayments = retryPaymentResponses.filter(
        (res) => res.status === HttpStatus.ACCEPTED,
      );
      const blockedPayments = retryPaymentResponses.filter(
        (res) => res.status === HttpStatus.BAD_REQUEST,
      );

      await waitForPaymentTransactionsToComplete({
        programId: programIdPV,
        paymentReferenceIds: registrationReferenceIdsPV,
        accessToken,
        maxWaitTimeMs: 30_000,
        paymentId,
        completeStatuses: [TransactionStatusEnum.success],
      });
      const transactions = await getTransactions({
        programId: programIdPV,
        paymentId,
        accessToken,
      });
      const transactionId = transactions.body[0].id;
      const transactionEvents = await getTransactionEvents({
        programId: programIdPV,
        transactionId,
        accessToken,
      });
      const retryEventsOfOneTransction = transactionEvents.body.data.filter(
        (event: TransactionEventInterface) =>
          event.type === TransactionEventType.retry,
      );

      // Assert
      expect(retriedPayments.length).toBe(1);
      expect(blockedPayments.length).toBe(4);
      expect(retryEventsOfOneTransction.length).toBe(1);
    });
  });

  it('should not be in progress for a different program', async () => {
    // Arrange
    await seedIncludedRegistrations(
      registrationsOCW,
      programIdOCW,
      accessToken,
    );

    // Act
    // We do a payment and we do not wait for all transactions to complete
    const doPaymentResponse = await createAndStartPayment({
      programId: programIdPV,
      transferValue,
      referenceIds: [],
      accessToken,
    });
    const paymentIdPv = doPaymentResponse.body.id;

    const getProgramPaymentsPvResult = (
      await getProgramPaymentsStatus(programIdPV, accessToken)
    ).body;
    const getProgramPaymentsOcwResult = (
      await getProgramPaymentsStatus(programIdOCW, accessToken)
    ).body;

    const doPaymentOcwResultPaymentNext = await createAndStartPayment({
      programId: programIdOCW,
      transferValue,
      referenceIds: [],
      accessToken,
    });

    const multiEndpointPaymentProgressPv =
      await getPaymentProgressStatusForMultipleEndpoints({
        programId: programIdPV,
        accessToken,
        paymentId: paymentIdPv,
      });

    // Assert
    expect(getProgramPaymentsPvResult.inProgress).toBe(true);
    expect(getProgramPaymentsOcwResult.inProgress).toBe(false);

    expect(doPaymentOcwResultPaymentNext.status).toBe(HttpStatus.ACCEPTED);
    expect(multiEndpointPaymentProgressPv).toMatchObject({
      paymentIsInProgress: true,
      createPaymentBlocked: true,
      startPaymentBlocked: true,
      retryPaymentBlocked: true,
    });

    // Cleanup to make sure nothing is in progress anymore
    await waitForPaymentTransactionsToComplete({
      programId: programIdPV,
      paymentReferenceIds: registrationReferenceIdsPV,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: paymentIdPv,
    });
    await waitForPaymentTransactionsToComplete({
      programId: programIdOCW,
      paymentReferenceIds: registrationReferenceIdsOCW,
      accessToken,
      maxWaitTimeMs: 30_000,
      paymentId: doPaymentOcwResultPaymentNext.body.id,
    });
  });
});
