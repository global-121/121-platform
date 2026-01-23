import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getTransactionsIntersolveVoucher,
  getVoucherBalance,
} from '@121-service/test/helpers/fsp-specific.helper';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Get Intersolve voucher balance', () => {
  let accessToken: string;

  const payment = 1;
  const transferValue = 22;

  beforeEach(async () => {
    await waitFor(1_000);
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    await waitFor(3_000);
  });

  it('should successfully get balance', async () => {
    // Arrange
    await importRegistrations(programIdPV, [registrationPV5], accessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdPV,
      referenceIds: [registrationPV5.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
    const paymentReferenceIds = [registrationPV5.referenceId];
    await doPayment({
      programId: programIdPV,
      transferValue,
      referenceIds: paymentReferenceIds,
      accessToken,
    });

    // make sure to wait for the transaction to be completed
    const getTransactionsBody = await getTransactionsIntersolveVoucher({
      programId: programIdPV,
      paymentId: payment,
      referenceId: registrationPV5.referenceId,
      accessToken,
    });

    // Act
    const getVoucherBalanceResponse = await getVoucherBalance(
      programIdPV,
      payment,
      registrationPV5.referenceId,
      accessToken,
    );

    // Assert
    expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.success);
    expect(getVoucherBalanceResponse.status).toBe(200);
    expect(getVoucherBalanceResponse.text).toBe('12.5'); // This is the number our mock gives back
  });
});
