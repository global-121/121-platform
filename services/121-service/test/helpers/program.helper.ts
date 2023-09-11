import * as request from 'supertest';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { getServer, waitFor } from './utility.helper';

export async function publishProgram(
  programId: number,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/change-phase`)
    .send({ newPhase: 'registrationValidation' });
}

export async function changePhase(
  programId: number,
  newPhase: ProgramPhase,
  access_token: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/change-phase`)
    .set('Cookie', [access_token])
    .send({ newPhase: newPhase });
}

export async function doPayment(
  programId: number,
  paymentNr: number,
  amount: number,
  referenceIds: string[],
  access_token: string,
): Promise<request.Response> {
  return await getServer()
    .post(`/programs/${programId}/payments`)
    .set('Cookie', [access_token])
    .send({
      payment: paymentNr,
      amount: amount,
      referenceIds: { referenceIds: referenceIds },
    });
}

export async function retryPayment(
  programId: number,
  paymentNr: number,
  access_token: string,
): Promise<request.Response> {
  return await getServer()
    .patch(`/programs/${programId}/payments`)
    .set('Cookie', [access_token])
    .send({
      payment: paymentNr,
    });
}

export async function getTransactions(
  programId: number,
  paymentNr: number,
  referenceId: string,
  access_token: string,
): Promise<request.Response> {
  return await getServer()
    .get(`/programs/${programId}/payments/transactions`)
    .set('Cookie', [access_token])
    .query({ minPayment: paymentNr, referenceId: referenceId });
}

export async function exportList(
  programId: number,
  exportType: string,
  access_token: string,
  fromDate?: string,
  toDate?: string,
): Promise<request.Response> {
  const queryParams = {};
  if (fromDate) {
    queryParams['fromDate'] = fromDate;
  }
  if (toDate) {
    queryParams['toDate'] = toDate;
  }
  return await getServer()
    .get(`/programs/${programId}/export-metrics/export-list/${exportType}`)
    .set('Cookie', [access_token])
    .query(queryParams);
}

export async function waitForPaymentTransactionsToComplete(
  programId: number,
  paymentReferences: string[],
  accessToken: string,
  maxWaitTimeMs: number,
): Promise<void> {
  const startTime = Date.now();
  let allTransactionsSuccessful = false;

  while (Date.now() - startTime < maxWaitTimeMs && !allTransactionsSuccessful) {
    // Get payment transactions
    const paymentTransactions = await getTransactions(
      programId,
      null,
      null,
      accessToken,
    );

    // Check if all transactions have a status of "success"
    allTransactionsSuccessful = paymentReferences.every((referenceId) => {
      const transaction = paymentTransactions.body.find(
        (txn) => txn.referenceId === referenceId,
      );
      return transaction && transaction.status === 'success';
    });

    // If not all transactions are successful, wait for a short interval before checking again
    if (!allTransactionsSuccessful) {
      await waitFor(1000); // Wait for 1 second (adjust as needed)
    }
  }

  if (!allTransactionsSuccessful) {
    throw new Error(`Timeout waiting for payment transactions to complete`);
  }
}
