import { MessageTemplateEntity } from '../../src/notifications/message-template/message-template.entity';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '../../src/registration/registration.entity';
import { waitFor } from '../../src/utils/waitFor.helper';
import { getTransactions } from './program.helper';

export const assertArraysAreEqual = (
  actualArray: any[],
  expectedArray: any[],
  keyToIgnore: string[],
): void => {
  // Sort both actualArray and expectedArray
  const sortedActualArray = sortByFspName(actualArray);
  const sortedExpectedArray = sortByFspName(expectedArray);

  expect(sortedActualArray.length).toBe(sortedExpectedArray.length);

  for (let i = 0; i < sortedActualArray.length; i++) {
    for (const subKey in sortedExpectedArray[i]) {
      if (!keyToIgnore.includes(subKey)) {
        expect(sortedActualArray[i][subKey]).toStrictEqual(
          sortedExpectedArray[i][subKey],
        );
      }
    }
  }
};

export function sortByFspName(array: { fsp: string }[]): any[] {
  return array.slice().sort((a, b) => {
    const nameA = a.fsp;
    const nameB = b.fsp;

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
}

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

export function processMessagePlaceholders(
  messageTemplates: MessageTemplateEntity[],
  registration: Partial<RegistrationEntity>,
  statusChange: RegistrationStatusEnum,
  placeholderKey: string,
): string {
  const template = messageTemplates.filter(
    (t) =>
      t.type === statusChange && t.language === registration.preferredLanguage,
  )[0].message;

  const processedTemplate = template.replace(
    new RegExp(`{{${placeholderKey}}}`, 'g'),
    registration[`${placeholderKey}`],
  );

  return processedTemplate;
}
