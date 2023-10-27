import { getTransactions } from './program.helper';
import { waitFor } from './utility.helper';

export const assertArraysAreEqual = (
  actualArray: any[],
  expectedArray: any[],
  keyToIgnore: string[],
): void => {
  expect(actualArray.length).toBe(expectedArray.length);
  for (let i = 0; i < actualArray.length; i++) {
    for (const subKey in expectedArray[i]) {
      if (!keyToIgnore.includes(subKey)) {
        expect(actualArray[i][subKey]).toStrictEqual(expectedArray[i][subKey]);
      }
    }
  }
};

export const assertObjectsAreEqual = (
  actualObject: any,
  expectedObject: any,
  keyToIgnore: string[],
): void => {
  for (const subKey in expectedObject) {
    if (!keyToIgnore.includes(subKey)) {
      expect(actualObject[subKey]).toStrictEqual(expectedObject[subKey]);
    }
  }
};

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
