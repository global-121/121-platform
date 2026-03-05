import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  approvePayment,
  createPayment,
  deletePayment,
  getPayments,
  startPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Delete payment', () => {
  const programId = programIdPV;
  const transferValue = 25;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await seedIncludedRegistrations([registrationPV5], programId, accessToken);
  });

  it('should successfully delete a payment that has not been started', async () => {
    // Arrange
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
    });
    expect(createResponse.status).toBe(HttpStatus.CREATED);
    const paymentId = createResponse.body.id;

    // Act
    const deleteResponse = await deletePayment({
      programId,
      paymentId,
      accessToken,
    });

    // Assert
    expect(deleteResponse.status).toBe(HttpStatus.NO_CONTENT);

    const paymentsAfterDelete = await getPayments(programId, accessToken);
    expect(paymentsAfterDelete.body).toHaveLength(0);
  });

  it('should return 404 when the payment does not exist for this program', async () => {
    // Act
    const deleteResponse = await deletePayment({
      programId,
      paymentId: 999999,
      accessToken,
    });

    // Assert
    expect(deleteResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return 400 when the payment has already been started', async () => {
    // Arrange
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
    });
    const paymentId = createResponse.body.id;
    await approvePayment({ programId, paymentId, accessToken });
    await startPayment({ programId, paymentId, accessToken });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationPV5.referenceId],
      accessToken,
      maxWaitTimeMs: 10000,
    });

    // Act
    const deleteResponse = await deletePayment({
      programId,
      paymentId,
      accessToken,
    });

    // Assert
    expect(deleteResponse.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should return 403 when the user does not have PaymentCREATE permission', async () => {
    // Arrange
    const createResponse = await createPayment({
      programId,
      transferValue,
      referenceIds: [registrationPV5.referenceId],
      accessToken,
    });
    const paymentId = createResponse.body.id;

    const tokenWithoutPermission = await createAccessTokenWithPermissions({
      permissions: [PermissionEnum.PaymentREAD],
      adminAccessToken: accessToken,
      programId,
    });

    // Act
    const deleteResponse = await deletePayment({
      programId,
      paymentId,
      accessToken: tokenWithoutPermission,
    });

    // Assert
    expect(deleteResponse.status).toBe(HttpStatus.FORBIDDEN);
  });
});
