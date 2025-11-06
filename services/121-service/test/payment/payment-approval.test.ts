import { HttpStatus } from '@nestjs/common';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createPayment,
  startPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenCvaManager,
  getAccessTokenFinanceManager,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

let adminAccessToken: string;
const programId = programIdPV;
const transferValue = 25;
describe('Payment approval flow', () => {
  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    adminAccessToken = await getAccessToken();
    await seedIncludedRegistrations(
      [registrationPV5],
      programId,
      adminAccessToken,
    );
  });

  it('user who can create a payment is different from user starting payment', async () => {
    // TODO: extend this with approval once the approval flow is implemented

    // Arrange
    const registrationAh = { ...registrationPV5, maxPayments: 1 };

    const accessTokenCvaManager = await getAccessTokenCvaManager();
    const accessTokenFinanceManager = await getAccessTokenFinanceManager();

    // Act
    const createPaymentResponseFinanceManager = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationAh.referenceId],
      accessToken: accessTokenFinanceManager,
    });

    const createPaymentResponseCvaManager = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationAh.referenceId],
      accessToken: accessTokenCvaManager,
    });

    const paymentId = createPaymentResponseCvaManager.body.id;

    // Start payment with CVA manager
    const startPaymentResponseCvaManager = await startPayment({
      programId,
      paymentId,
      accessToken: accessTokenCvaManager,
    });

    const startPaymentResponseFinanceManager = await startPayment({
      programId,
      paymentId,
      accessToken: accessTokenFinanceManager,
    });

    // Wait for payment transactions to complete to cleanup in progress stuff
    await waitForPaymentTransactionsToComplete({
      programId,
      paymentId,
      paymentReferenceIds: [registrationAh.referenceId],
      accessToken: adminAccessToken,
      maxWaitTimeMs: 5000,
      completeStatusses: [TransactionStatusEnum.success],
    });

    // Assert
    // Cva manager can only create a payment and a finance manager can create and start a payment
    expect(createPaymentResponseCvaManager.status).toBe(HttpStatus.ACCEPTED);
    expect(createPaymentResponseFinanceManager.status).toBe(
      HttpStatus.ACCEPTED,
    );
    expect(startPaymentResponseCvaManager.status).toBe(HttpStatus.FORBIDDEN);
    expect(startPaymentResponseFinanceManager.status).toBe(HttpStatus.ACCEPTED);
  });
});
