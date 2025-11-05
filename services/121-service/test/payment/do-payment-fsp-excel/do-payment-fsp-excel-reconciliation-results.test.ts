/* eslint-disable jest/no-conditional-expect */

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { ImportStatus } from '@121-service/src/registration/dto/bulk-import.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getTransactions,
  importFspReconciliationData,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  getTransactionEventDescriptions,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdWesteros,
  registrationWesteros1,
  registrationWesteros2,
  registrationWesteros3,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Do payment with Excel FSP', () => {
  let accessToken: string;
  // Payment info
  const amount = 10;

  let pamymentIdWesteros: number;

  // Registrations
  const registrationsWesteros = [
    registrationWesteros1,
    registrationWesteros2,
    registrationWesteros3,
  ];
  const phoneNumbersWesteros = registrationsWesteros.map(
    (registration) => registration.phoneNumber,
  );

  const matchColumn = FspAttributes.phoneNumber;
  beforeEach(async () => {
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
  });

  describe('Import FSP reconciliation data', () => {
    it('Should update transaction status based on imported reconciliation data', async () => {
      // Arrange
      const errorMessage = 'FSP reported failure for registrationWesteros2';

      pamymentIdWesteros = await seedPaidRegistrations(
        registrationsWesteros,
        programIdWesteros,
        amount,
        [TransactionStatusEnum.waiting],
      );

      // construct reconciliation-file here
      const reconciliationDataIronbank = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
          status: TransactionStatusEnum.success,
        },
        {
          [matchColumn]: registrationWesteros2.phoneNumber,
          status: TransactionStatusEnum.error,
          errorMessage,
        },
        { [matchColumn]: '123456789', status: TransactionStatusEnum.error },
      ];

      // Act
      const importResult = await importFspReconciliationData(
        programIdWesteros,
        pamymentIdWesteros,
        accessToken,
        reconciliationDataIronbank,
      );
      const importResultRecords = JSON.parse(importResult.text).importResult;

      await waitForPaymentTransactionsToComplete({
        programId: programIdWesteros,
        paymentReferenceIds: [
          registrationWesteros1.referenceId,
          registrationWesteros2.referenceId,
        ], // Only wait for the transactions that should change
        accessToken,
        maxWaitTimeMs: 10_000,
        completeStatusses: [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
        ],
      });
      const transactionsResponse = await getTransactions({
        programId: programIdWesteros,
        paymentId: pamymentIdWesteros,
        registrationReferenceId: null,
        accessToken,
      });

      // Assert
      // Check per import record if it is imported or not found
      for (const importResultRecord of importResultRecords) {
        if (phoneNumbersWesteros.includes(importResultRecord[matchColumn])) {
          expect(importResultRecord.importStatus).not.toBe(
            ImportStatus.notFound,
          );
        } else {
          expect(importResultRecord.importStatus).toBe(ImportStatus.notFound);
        }
      }
      // Check for updated transaction if the status matches the imported status
      const transactionSuccess = transactionsResponse.body.find(
        (t) => t.registrationReferenceId === registrationWesteros1.referenceId,
      );
      expect(transactionSuccess.status).toBe(TransactionStatusEnum.success);
      expect(transactionSuccess.errorMessage).toBeNull();

      const transactionError = transactionsResponse.body.find(
        (t) => t.registrationReferenceId === registrationWesteros2.referenceId,
      );
      expect(transactionError.status).toBe(TransactionStatusEnum.error);
      expect(transactionError.errorMessage).toBe(errorMessage);

      const transactionWaiting = transactionsResponse.body.find(
        (t) => t.registrationReferenceId === registrationWesteros3.referenceId,
      );
      expect(transactionWaiting.status).toBe(TransactionStatusEnum.waiting);
    });

    it('Should overwrite previous reconciliation data upload and create events', async () => {
      // Arrange
      pamymentIdWesteros = await seedPaidRegistrations(
        [registrationWesteros1],
        programIdWesteros,
        amount,
        [TransactionStatusEnum.waiting],
      );

      const reconciliationDataIronbank = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
          status: TransactionStatusEnum.success,
        },
      ];

      // First import
      await importFspReconciliationData(
        programIdWesteros,
        pamymentIdWesteros,
        accessToken,
        reconciliationDataIronbank,
      );

      // Re-import with different status

      const reconciliationDataIronbankOverwrite = [
        {
          [matchColumn]: registrationWesteros1.phoneNumber,
          status: TransactionStatusEnum.error,
        },
      ];

      await importFspReconciliationData(
        programIdWesteros,
        pamymentIdWesteros,
        accessToken,
        reconciliationDataIronbankOverwrite,
      );

      const transactionsResponse = await getTransactions({
        programId: programIdWesteros,
        paymentId: pamymentIdWesteros,
        registrationReferenceId: null,
        accessToken,
      });
      const transaction = transactionsResponse.body.find(
        (t) => t.registrationReferenceId === registrationWesteros1.referenceId,
      );

      const transactionEvents = await getTransactionEventDescriptions({
        programId: programIdWesteros,
        transactionId: transaction.id,
        accessToken,
      });

      // Assert
      expect(transaction.status).toBe(TransactionStatusEnum.error);
      expect(transactionEvents).toEqual([
        TransactionEventDescription.created,
        TransactionEventDescription.initiated,
        TransactionEventDescription.excelPreparationForExport,
        TransactionEventDescription.excelReconciliationFileUpload,
        TransactionEventDescription.excelReconciliationFileUpload,
      ]);
    });
  });
});
