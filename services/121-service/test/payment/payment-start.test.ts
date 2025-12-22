import { HttpStatus } from '@nestjs/common';

import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  approvePayment,
  createPayment,
  getPaymentEvents,
  getTransactionsByPaymentIdPaginated,
  retryPayment,
  startPayment,
  waitForPaymentAndTransactionsToComplete,
  waitForPaymentNotInProgress,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getRegistrations,
  seedIncludedRegistrations,
  waitForRegistrationToHaveUpdatedPaymentCount,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Payment start', () => {
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

    // Act 1 - create & approve payment
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });
    const paymentId = createPaymentResponse.body.id;
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 20_000,
      completeStatuses: [TransactionStatusEnum.pendingApproval],
    });
    await approvePayment({
      programId,
      paymentId,
      accessToken,
    });

    // Assert 1 - before starting payment
    const getTransactionsBeforeStartResponse =
      await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        registrationReferenceId: registrationAh.referenceId,
        accessToken,
      });
    const transactionsBeforeStart =
      getTransactionsBeforeStartResponse.body.data;

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
      TransactionStatusEnum.approved,
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
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds,
      accessToken,
      maxWaitTimeMs: 20_000,
    });

    // Assert 2 - after payment
    const getTransactionsAfterStartResponse =
      await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        registrationReferenceId: registrationAh.referenceId,
        accessToken,
      });
    const transactionsAfterStart = getTransactionsAfterStartResponse.body.data;
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

  describe('with included and non-included registrations', () => {
    let paymentId: number;
    beforeEach(async () => {
      const registrations = [registrationPV5, registrationPV6];
      await seedIncludedRegistrations(registrations, programId, accessToken);
      // only create & approve, not start yet
      const createPaymentResponse = await createPayment({
        programId,
        transferValue,
        referenceIds: registrations.map((r) => r.referenceId),
        accessToken,
      });
      paymentId = createPaymentResponse.body.id;
      await waitForPaymentAndTransactionsToComplete({
        programId,
        paymentReferenceIds: registrations.map((r) => r.referenceId),
        accessToken,
        maxWaitTimeMs: 20_000,
        completeStatuses: [TransactionStatusEnum.pendingApproval],
      });
      await approvePayment({
        programId,
        paymentId,
        accessToken,
      });

      // Make one registration non-included
      await awaitChangeRegistrationStatus({
        programId,
        referenceIds: [registrationPV5.referenceId],
        status: RegistrationStatusEnum.declined,
        accessToken,
      });
    });

    it('should fail transactions of non-included registrations', async () => {
      // Arrange > beforeEach

      // Act
      await startPayment({
        programId,
        paymentId,
        accessToken,
      });
      // Wait for payment not in progress anymore instead of using waitForPaymentAndTransactionsToComplete. As we cannot just wait for the other transaction to complete, as we should give the time in theory for the declined transaction to also process, even though the assertion is that it shouldn't.
      await waitForPaymentNotInProgress({
        programId,
        accessToken,
      });

      // Assert
      const getTransactionsResponse = await getTransactionsByPaymentIdPaginated(
        {
          programId,
          paymentId,
          accessToken,
        },
      );
      const transactions = getTransactionsResponse.body.data;
      const startedTransactions = transactions.filter(
        (t: any) => t.status !== TransactionStatusEnum.pendingApproval,
      );
      const failedTransactions = transactions.filter(
        (t: any) => t.status === TransactionStatusEnum.error,
      );

      expect(startedTransactions.length).toBe(2);
      expect(failedTransactions.length).toBe(1);
      expect(failedTransactions[0].errorMessage).toMatchSnapshot();
    });

    it('should successfully retry failed transactions after being included again', async () => {
      // Arrange > beforeEach
      // start first payment
      await startPayment({
        programId,
        paymentId,
        accessToken,
      });
      // only wait for the transaction of the included registration to complete
      await waitForPaymentAndTransactionsToComplete({
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
      const retryPaymentResponse = await retryPayment({
        programId,
        paymentId,
        accessToken,
      });
      await waitForPaymentAndTransactionsToComplete({
        programId,
        paymentReferenceIds: [registrationPV5, registrationPV6].map(
          (r) => r.referenceId,
        ),
        accessToken,
        maxWaitTimeMs: 10_000,
      });

      // Assert
      expect(retryPaymentResponse.status).toBe(HttpStatus.ACCEPTED);

      const getTransactionsResponse = await getTransactionsByPaymentIdPaginated(
        {
          programId,
          paymentId,
          accessToken,
        },
      );
      const transactions = getTransactionsResponse.body.data;
      const successTransactions = transactions.filter(
        (t: any) => t.status === TransactionStatusEnum.success,
      );
      expect(successTransactions.length).toBe(2);
    });
  });

  it('should only start payment for scope of requesting user', async () => {
    /////////////
    // Arrange //
    /////////////

    const accessTokenKisumu = await createAccessTokenWithPermissions({
      permissions: Object.values(PermissionEnum),
      programId,
      scope: DebugScope.Kisumu,
      adminAccessToken: accessToken,
    });
    const accessTokenTurkana = await createAccessTokenWithPermissions({
      permissions: Object.values(PermissionEnum),
      programId,
      scope: DebugScope.Turkana,
      adminAccessToken: accessToken,
    });

    // add 2 registrations with different scope
    const registrationScopeKisumu = {
      ...registrationPV5,
      scope: DebugScope.Kisumu,
    };
    const registrationScopeTurkana = {
      ...registrationPV6,
      scope: DebugScope.Turkana,
    };
    const registrations = [registrationScopeKisumu, registrationScopeTurkana];
    await seedIncludedRegistrations(registrations, programId, accessToken);

    // create & approve payment by admin-user with full scope
    const createPaymentResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: registrations.map((r) => r.referenceId),
      accessToken,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: registrations.map((r) => r.referenceId),
      accessToken,
      maxWaitTimeMs: 20_000,
      completeStatuses: [TransactionStatusEnum.pendingApproval],
    });
    await approvePayment({
      programId,
      paymentId: createPaymentResponse.body.id,
      accessToken,
    });

    //////////////////
    // Act & Assert //
    //////////////////

    // Start payment with Kisumu-scoped user
    const paymentId = createPaymentResponse.body.id;
    const startPaymentResponseKisumu = await startPayment({
      programId,
      paymentId,
      accessToken: accessTokenKisumu,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationScopeKisumu.referenceId],
      accessToken,
      maxWaitTimeMs: 5_000,
    });
    expect(startPaymentResponseKisumu.status).toBe(HttpStatus.ACCEPTED);

    // get all transactions to assert only Kisumu one was started
    const getAllTransactionsResponse =
      await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        accessToken,
      });
    const allTransactions = getAllTransactionsResponse.body.data;
    const startedTransactions = allTransactions.filter(
      (t: any) => t.status !== TransactionStatusEnum.approved,
    );
    expect(startedTransactions.length).toBe(1);

    // Try to start Kisumu again to assert that it fails
    const startPaymentResponseKisumuSecondAttempt = await startPayment({
      programId,
      paymentId,
      accessToken: accessTokenKisumu,
    });
    expect(startPaymentResponseKisumuSecondAttempt.status).toBe(
      HttpStatus.BAD_REQUEST,
    );

    // Start payment with Turkana-scoped user
    const startPaymentResponseTurkana = await startPayment({
      programId,
      paymentId,
      accessToken: accessTokenTurkana,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationScopeTurkana.referenceId],
      accessToken,
      maxWaitTimeMs: 20_000,
    });

    // get all transactions to assert all were started now
    const getAllTransactionsResponseEnd =
      await getTransactionsByPaymentIdPaginated({
        programId,
        paymentId,
        accessToken,
      });
    const allTransactionsEnd = getAllTransactionsResponseEnd.body.data;
    const startedTransactionsEnd = allTransactionsEnd.filter(
      (t: any) => t.status !== TransactionStatusEnum.approved,
    );

    expect(startPaymentResponseTurkana.status).toBe(HttpStatus.ACCEPTED);
    expect(startedTransactionsEnd.length).toBe(2);

    // Assert 2 payment started events
    const paymentEvents = await getPaymentEvents({
      programId,
      paymentId,
      accessToken,
    });
    const paymentStartedEvents = paymentEvents.body.data.filter(
      (e) => e.type === PaymentEvent.started,
    );
    expect(paymentStartedEvents.length).toBe(2);
  });
});
