import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  createPayment,
  getPayments,
  getPaymentSummary,
} from '@121-service/test/helpers/program.helper';
import {
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Payment retrieval', () => {
  const programId = programIdPV;
  const transferValue = 25;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
    await seedIncludedRegistrations([registrationPV5], programId, accessToken);
  });

  it('should return the payment name in the payments list', async () => {
    // Arrange
    const paymentName = 'Payment 1';
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      name: paymentName,
    });
    const paymentId = createResponse.body.id;

    // Act
    const paymentsResponse = await getPayments(programId, accessToken);

    // Assert
    expect(paymentsResponse.status).toBe(HttpStatus.OK);
    const createdPayment = paymentsResponse.body.find(
      (payment: { paymentId: number }) => payment.paymentId === paymentId,
    );
    expect(createdPayment).toBeDefined();
    expect(createdPayment.name).toBe(paymentName);
  });

  it('should return the payment name in the single payment summary', async () => {
    // Arrange
    const paymentName = 'Payment 2';
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
      name: paymentName,
    });
    const paymentId = createResponse.body.id;

    // Act
    const paymentSummaryResponse = await getPaymentSummary({
      programId,
      paymentId,
      accessToken,
    });

    // Assert
    expect(paymentSummaryResponse.status).toBe(HttpStatus.OK);
    expect(paymentSummaryResponse.body.paymentId).toBe(paymentId);
    expect(paymentSummaryResponse.body.name).toBe(paymentName);
  });
});
