import * as request from 'supertest';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { getTransactions } from '@121-service/test/helpers/program.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function getTransactionsIntersolveVoucher(
  programId: number,
  payment: number,
  referenceId: string,
  accessToken: string,
): Promise<any[]> {
  let getTransactionsBody: any[] = [];
  let attempts = 0;
  while (attempts <= 10) {
    attempts++;
    getTransactionsBody = (
      await getTransactions({
        programId,
        paymentNr: payment,
        registrationReferenceId: referenceId,
        accessToken,
      })
    ).body;

    if (
      getTransactionsBody.length > 0 &&
      getTransactionsBody[0].status === TransactionStatusEnum.success
    ) {
      break;
    }

    await waitFor(2_000);
  }
  return getTransactionsBody;
}

export async function getVoucherBalance(
  programId: number,
  payment: number,
  referenceId: string | null,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/fsps/intersolve-voucher/vouchers/balance`)
    .set('Cookie', [accessToken])
    .query({ payment, referenceId });
}

export async function cacheUnusedVouchers(
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch('/fsps/intersolve-voucher/unused-vouchers')
    .set('Cookie', [accessToken]);
}
