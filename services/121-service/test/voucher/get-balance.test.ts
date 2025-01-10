import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import {
  getTransactionsIntersolveVoucher,
  getVoucherBalance,
} from '@121-service/test/helpers/intersolve-voucher.helper';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
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
  const amount = 22;

  beforeEach(async () => {
    await waitFor(1_000);
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
    await waitFor(3_000);
  });

  it('should succesfully get balance', async () => {
    // Arrange
    await importRegistrations(programIdPV, [registrationPV5], accessToken);
    await awaitChangePaStatus(
      programIdPV,
      [registrationPV5.referenceId],
      RegistrationStatusEnum.included,
      accessToken,
    );
    const paymentReferenceIds = [registrationPV5.referenceId];
    await doPayment(
      programIdPV,
      payment,
      amount,
      paymentReferenceIds,
      accessToken,
    );

    // make sure to wait for the transaction to be completed
    const getTransactionsBody = await getTransactionsIntersolveVoucher(
      programIdPV,
      payment,
      registrationPV5.referenceId,
      accessToken,
    );

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
