import * as request from 'supertest';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';
import { getTransactions } from '@121-service/test/helpers/project.helper';
import { getServer } from '@121-service/test/helpers/utility.helper';

export async function getTransactionsIntersolveVoucher({
  projectId,
  paymentId,
  referenceId,
  accessToken,
}: {
  projectId: number;
  paymentId: number;
  referenceId: string;
  accessToken: string;
}): Promise<any[]> {
  let getTransactionsBody: any[] = [];
  let attempts = 0;
  while (attempts <= 10) {
    attempts++;
    getTransactionsBody = (
      await getTransactions({
        projectId,
        paymentId,
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
  projectId: number,
  paymentId: number,
  referenceId: string | null,
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/projects/${projectId}/fsps/intersolve-voucher/vouchers/balance`)
    .set('Cookie', [accessToken])
    .query({ paymentId, referenceId });
}

export async function triggerUnusedVouchersCache(
  accessToken: string,
): Promise<request.Response> {
  return await getServer()
    .patch('/cronjobs/fsps/intersolve-voucher/unused-vouchers')
    .set('Cookie', [accessToken]);
}
