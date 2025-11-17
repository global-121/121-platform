import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  seedIncludedRegistrations,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV6,
  registrationPV7,
  registrationPV8,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Get program stats', () => {
  let accessToken: string;
  const transferValue = 50;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully get correct program stats, including cashDisbursed only counting started non-error transactions', async () => {
    // Arrange
    // Set up 2 registrations of which 1 fails (visa)
    registrationPV7.fullName = 'mock-fail-create-customer';
    const registrationsPV = [registrationPV6, registrationPV7];
    await seedPaidRegistrations({
      registrations: registrationsPV,
      programId: programIdPV,
      amount: transferValue,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
    // Also add a non-started transaction
    await seedIncludedRegistrations(
      [registrationPV8],
      programIdPV,
      accessToken,
    );
    const paymentId = (
      await createPayment({
        programId: programIdPV,
        transferValue,
        referenceIds: [registrationPV8.referenceId],
        accessToken,
      })
    ).body.id;
    await waitForPaymentTransactionsToComplete({
      programId: programIdPV,
      paymentReferenceIds: [registrationPV8.referenceId],
      accessToken,
      maxWaitTimeMs: 4_000,
      completeStatusses: [TransactionStatusEnum.pendingApproval],
      paymentId,
    });

    // Act
    const getProgramStatsResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/program-stats-summary`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    expect(getProgramStatsResponse.statusCode).toBe(HttpStatus.OK);
    const expectedCashDisbursed = 1 * transferValue; // 1 successful payments, one failed, one not started
    expect(getProgramStatsResponse.body).toEqual(
      expect.objectContaining({
        cashDisbursed: expectedCashDisbursed,
        includedPeople: 3, // 2 started + 1 not started
        newPeople: 0,
        programId: programIdPV,
        registeredPeople: 3, // 2 started + 1 not started
        targetedPeople: 250,
        totalBudget: 10000,
      }),
    );
  });
});
