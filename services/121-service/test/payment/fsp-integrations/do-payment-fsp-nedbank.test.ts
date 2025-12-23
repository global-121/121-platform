import { HttpStatus } from '@nestjs/common';

import { NedbankVoucherStatus } from '@121-service/src/fsp-integrations/integrations/nedbank/enums/nedbank-voucher-status.enum';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { ImportRegistrationsDto } from '@121-service/src/registration/dto/bulk-import.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  exportTransactionsByDateRangeJson,
  getTransactionsByPaymentIdPaginated,
  retryPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { deleteProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  getTransactionEventDescriptions,
  seedIncludedRegistrations,
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  runCronJobDoNedbankReconciliation,
} from '@121-service/test/helpers/utility.helper';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const transferValue = 200;

enum NedbankMockNumber {
  failDebitorAccountIncorrect = '27000000001',
  failTimoutSimulate = '27000000002',
}

enum NebankGetOrderMockReference {
  orderNotFound = 'mock-order-not-found',
  mock = 'mock',
  phoneNumberIncorrect = 'mock-phone-number-incorrect',
  tooManyRequestsForThisVoucher = 'mock-too-many-requests-for-this-voucher',
}

describe('Do payment', () => {
  describe('with FSP: Nedbank', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nedbankProgram, __filename);
      accessToken = await getAccessToken();
    });

    describe('when create order API call gives a valid response', () => {
      it('should successfully do a payment', async () => {
        // Arrange
        const paymentReferenceIds = [registrationNedbank.referenceId];
        await seedIncludedRegistrations(
          [registrationNedbank],
          programId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          transferValue,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatuses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        const getTransactionsBeforeCronjob =
          await getTransactionsByPaymentIdPaginated({
            programId,
            paymentId,
            registrationReferenceId: registrationNedbank.referenceId,
            accessToken,
          });
        const transactionsBeforeCronJob =
          getTransactionsBeforeCronjob.body.data;
        const transactionBeforeCronJob = transactionsBeforeCronJob[0];

        // Cronjob should update the status of the transaction
        await runCronJobDoNedbankReconciliation();
        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 6_000,
          completeStatuses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        const getTransactionsAfterCronjob =
          await getTransactionsByPaymentIdPaginated({
            programId,
            paymentId,
            registrationReferenceId: registrationNedbank.referenceId,
            accessToken,
          });
        const transactionsAfterCronJob = getTransactionsAfterCronjob.body.data;
        const transactionAfterCronJob = transactionsAfterCronJob[0];

        const exportTransactionResponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });

        const transaction = exportTransactionResponse[0];

        // Assert
        expect(doPaymentResponse.status).toBe(HttpStatus.CREATED);
        expect(doPaymentResponse.body.applicableCount).toBe(
          paymentReferenceIds.length,
        );
        expect(doPaymentResponse.body.totalFilterCount).toBe(
          paymentReferenceIds.length,
        );
        expect(doPaymentResponse.body.nonApplicableCount).toBe(0);
        expect(doPaymentResponse.body.sumPaymentAmountMultiplier).toBe(
          registrationNedbank.paymentAmountMultiplier,
        );
        expect(transactionBeforeCronJob.status).toBe(
          TransactionStatusEnum.waiting,
        );
        expect(transactionBeforeCronJob.errorMessage).toBe(null);
        expect(transactionAfterCronJob.status).toBe(
          TransactionStatusEnum.success,
        );
        expect(transaction.nedbankVoucherStatus).toBe(
          NedbankVoucherStatus.REDEEMED,
        );
        expect(transaction.nedbankOrderCreateReference).toBeDefined();
        expect(transaction.nedbankPaymentReference).toMatchSnapshot();

        const transactionEventDescriptions =
          await getTransactionEventDescriptions({
            programId,
            transactionId: transactionsAfterCronJob[0].id,
            accessToken,
          });
        expect(transactionEventDescriptions).toEqual([
          TransactionEventDescription.created,
          TransactionEventDescription.approval,
          TransactionEventDescription.initiated,
          TransactionEventDescription.nedbankVoucherCreationRequested,
          TransactionEventDescription.nedbankCallbackReceived,
        ]);
      });

      it('should create a transaction with status error when phone number is missing', async () => {
        const registrationFailDebitorAccount = {
          ...registrationNedbank,
          phoneNumber: NedbankMockNumber.failDebitorAccountIncorrect,
        };
        const paymentReferenceIds = [
          registrationFailDebitorAccount.referenceId,
        ];
        await seedIncludedRegistrations(
          [registrationFailDebitorAccount],
          programId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          transferValue,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatuses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        const getTransactionsResponse =
          await getTransactionsByPaymentIdPaginated({
            programId,
            paymentId,
            registrationReferenceId: registrationFailDebitorAccount.referenceId,
            accessToken,
          });
        const transactions = getTransactionsResponse.body.data;

        // Assert
        expect(transactions[0].status).toBe(TransactionStatusEnum.error);
        expect(transactions[0].errorMessage).toMatchSnapshot();

        const transactionEventDescriptions =
          await getTransactionEventDescriptions({
            programId,
            transactionId: transactions[0].id,
            accessToken,
          });
        expect(transactionEventDescriptions).toEqual([
          TransactionEventDescription.created,
          TransactionEventDescription.approval,
          TransactionEventDescription.initiated,
          TransactionEventDescription.nedbankVoucherCreationRequested,
        ]);
      });

      it('should create a transaction with status error when we make a payment with a payment amount of over 5000', async () => {
        const amountOver6000 = 6000;
        const paymentReferenceIds = [registrationNedbank.referenceId];
        await seedIncludedRegistrations(
          [registrationNedbank],
          programId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          transferValue: amountOver6000,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatuses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        const getTransactionsResponse =
          await getTransactionsByPaymentIdPaginated({
            programId,
            paymentId,
            registrationReferenceId: registrationNedbank.referenceId,
            accessToken,
          });
        const transactions = getTransactionsResponse.body.data;

        // Assert
        expect(transactions[0].status).toBe(TransactionStatusEnum.error);
        expect(transactions[0].errorMessage).toMatchSnapshot();

        const transactionEventDescriptions =
          await getTransactionEventDescriptions({
            programId,
            transactionId: transactions[0].id,
            accessToken,
          });
        expect(transactionEventDescriptions).toEqual([
          TransactionEventDescription.created,
          TransactionEventDescription.approval,
          TransactionEventDescription.initiated,
          TransactionEventDescription.nedbankVoucherCreationRequested,
        ]);
      });

      it('should set transaction status to error in reconciliation process if phonenumber is incorrect', async () => {
        // Arrange
        const registrationFailPhoneNumber = {
          ...registrationNedbank,
          referenceId: NebankGetOrderMockReference.phoneNumberIncorrect,
        };
        const paymentReferenceIds = [registrationFailPhoneNumber.referenceId];
        await seedIncludedRegistrations(
          [registrationFailPhoneNumber],
          programId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          transferValue,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatuses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        await runCronJobDoNedbankReconciliation();

        const getTransactionsResponse =
          await getTransactionsByPaymentIdPaginated({
            programId,
            paymentId,
            registrationReferenceId: registrationFailPhoneNumber.referenceId,
            accessToken,
          });
        const transactions = getTransactionsResponse.body.data;

        // Assert
        expect(transactions[0].status).toBe(TransactionStatusEnum.error);
        expect(transactions[0].errorMessage).toMatchSnapshot();

        const transactionEventDescriptions =
          await getTransactionEventDescriptions({
            programId,
            transactionId: transactions[0].id,
            accessToken,
          });
        expect(transactionEventDescriptions).toEqual([
          TransactionEventDescription.created,
          TransactionEventDescription.approval,
          TransactionEventDescription.initiated,
          TransactionEventDescription.nedbankVoucherCreationRequested,
          TransactionEventDescription.nedbankCallbackReceived,
        ]);
      });

      it('should not update the transaction status and voucher status if we get a too many requests error from the Nedbank API', async () => {
        // Arrange
        const registrationTooManyRequest = {
          ...registrationNedbank,
          referenceId:
            NebankGetOrderMockReference.tooManyRequestsForThisVoucher, // This referenceId will be copied to the orderCreateReference and this will simulate a too many requests error in our mock service when we try to get the order
        };
        const paymentReferenceIds = [registrationTooManyRequest.referenceId];
        await seedIncludedRegistrations(
          [registrationTooManyRequest],
          programId,
          accessToken,
        );

        // Act
        await doPayment({
          programId,
          transferValue,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatuses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        const paymentExportBeforeReconciliation = (
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          })
        )[0];

        await runCronJobDoNedbankReconciliation();
        const paymentExportAfterReconciliation = (
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          })
        )[0];

        // Assert
        expect(paymentExportAfterReconciliation.status).toBe(
          paymentExportBeforeReconciliation.status,
        );
        expect(paymentExportAfterReconciliation.errorMessage).toBe(
          paymentExportBeforeReconciliation.errorMessage,
        );
      });

      // This test is needed because if the Nedbank create order api is called with the same reference it will return the same response the second time
      // So we need to make sure that the order reference is different on a retry payment if the first create order failed
      it('should create a voucher with a new orderCreateReference on a retry payment', async () => {
        // Arrange
        const registrationFailDebitorAccount = {
          ...registrationNedbank,
          phoneNumber: NedbankMockNumber.failDebitorAccountIncorrect,
        };
        await seedIncludedRegistrations(
          [registrationFailDebitorAccount],
          programId,
          accessToken,
        );
        const doPaymentResponse = await doPayment({
          programId,
          transferValue,
          referenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;
        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
          maxWaitTimeMs: 5_000,
          completeStatuses: [TransactionStatusEnum.error],
        });
        const exportPaymentBeforeRetryResponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });

        const orderReferenceBeforeRetry =
          exportPaymentBeforeRetryResponse[0].nedbankOrderCreateReference;

        await updateRegistration(
          programId,
          registrationFailDebitorAccount.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );
        await retryPayment({
          programId,
          paymentId,
          accessToken,
        });
        await waitForPaymentAndTransactionsToComplete({
          programId,
          paymentReferenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
          maxWaitTimeMs: 5000,
          completeStatuses: [TransactionStatusEnum.waiting],
        });
        const exportPaymentAfterRetryReponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });

        const orderReferenceAfterRetry =
          exportPaymentAfterRetryReponse[0].nedbankOrderCreateReference;
        expect(orderReferenceBeforeRetry).not.toBe(orderReferenceAfterRetry);
      });

      it('should return the correct TransactionStatus for each NedbankVoucherStatus', async () => {
        // Arrange
        const nedbanVoucherStatusToTransactionStatus = {
          [NedbankVoucherStatus.PENDING]: TransactionStatusEnum.waiting,
          [NedbankVoucherStatus.PROCESSING]: TransactionStatusEnum.waiting,
          [NedbankVoucherStatus.REDEEMABLE]: TransactionStatusEnum.waiting,
          [NedbankVoucherStatus.REDEEMED]: TransactionStatusEnum.success,
          [NedbankVoucherStatus.REFUNDED]: TransactionStatusEnum.error,
        };
        const registrations: ImportRegistrationsDto[] = [];
        for (const status in nedbanVoucherStatusToTransactionStatus) {
          const registration = {
            ...registrationNedbank,
            referenceId: `${NebankGetOrderMockReference.mock}-${status}`,
          };
          registrations.push(registration);
        }
        await seedPaidRegistrations({
          registrations,
          programId,
          completeStatuses: [TransactionStatusEnum.waiting],
        });

        // Act
        await runCronJobDoNedbankReconciliation();
        const getExportTransactionsResponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });

        const exportListData = getExportTransactionsResponse;
        for (const exportData of exportListData) {
          const expectedStatus =
            nedbanVoucherStatusToTransactionStatus[
              exportData.nedbankVoucherStatus as NedbankVoucherStatus
            ];
          expect(exportData.status).toBe(expectedStatus);
        }
      });
    });

    describe('when the create order API call times out', () => {
      it('should update the transaction status to "success" in reconciliation process if the voucher is redeemed', async () => {
        // Arrange
        const registrationFailTimeout = {
          ...registrationNedbank,
          phoneNumber: NedbankMockNumber.failTimoutSimulate, // This phone number will simulate a time-out in our mock service
        };

        // Act
        await seedPaidRegistrations({
          registrations: [registrationFailTimeout],
          programId,
          completeStatuses: [TransactionStatusEnum.waiting],
        });
        const transactionsExportBeforeCronResponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });

        const transactionBeforeCron = transactionsExportBeforeCronResponse[0];

        await updateRegistration(
          programId,
          registrationFailTimeout.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );

        await runCronJobDoNedbankReconciliation();
        const transactionExportAfterCronResponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });

        const transactionAfterCron = transactionExportAfterCronResponse[0];

        // Assert
        expect(transactionBeforeCron.nedbankVoucherStatus).toBe(undefined);
        expect(transactionBeforeCron.status).toBe(
          TransactionStatusEnum.waiting,
        );
        expect(transactionAfterCron.nedbankOrderCreateReference).toBe(
          transactionBeforeCron.nedbankOrderCreateReference,
        );
        expect(transactionAfterCron.nedbankVoucherStatus).toBe(
          NedbankVoucherStatus.REDEEMED,
        );
        expect(transactionAfterCron.status).toBe(TransactionStatusEnum.success);
      });

      it('should update the transaction status to failed in the nedbank cronjob if the voucher is not found', async () => {
        // Arrange
        const registrationFailTimeout = {
          ...registrationNedbank,
          phoneNumber: NedbankMockNumber.failTimoutSimulate, // This phone number will simulate a time-out in our mock service
          referenceId: NebankGetOrderMockReference.orderNotFound, // This referenceId will be copied to the orderCreateReference and this will simulate a not found order in our mock service when we try to get the order
        };
        await seedPaidRegistrations({
          registrations: [registrationFailTimeout],
          programId,
          completeStatuses: [TransactionStatusEnum.waiting],
        });
        const transactionExportBeforeCronResponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });

        const transactionBeforeCron = transactionExportBeforeCronResponse[0];

        await updateRegistration(
          programId,
          registrationFailTimeout.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );

        await runCronJobDoNedbankReconciliation();
        const transactionExportAfterCronResponse =
          await exportTransactionsByDateRangeJson({
            programId,
            accessToken,
          });
        const transactionAfterCron = transactionExportAfterCronResponse[0];

        // Assert
        expect(transactionBeforeCron.nedbankVoucherStatus).toBe(undefined);
        expect(transactionBeforeCron.status).toBe(
          TransactionStatusEnum.waiting,
        );
        expect(transactionAfterCron.nedbankOrderCreateReference).toBe(
          transactionBeforeCron.nedbankOrderCreateReference,
        );
        expect(transactionAfterCron.nedbankVoucherStatus).toBe(
          NedbankVoucherStatus.FAILED,
        );
        expect(transactionAfterCron.status).toBe(TransactionStatusEnum.error);
        expect(transactionAfterCron.errorMessage).toMatchSnapshot();
      });
    });

    describe('when program financial service configuration is not set properly', () => {
      it('should fail payment by nedbank if paymentReferencePrefix is not configured for the program', async () => {
        // Arrange
        await seedIncludedRegistrations(
          [registrationNedbank],
          programId,
          accessToken,
        );
        const paymentReferenceIds = [registrationNedbank.referenceId];

        await deleteProgramFspConfigurationProperty({
          programId,
          configName: Fsps.nedbank,
          propertyName: FspConfigurationProperties.paymentReferencePrefix,
          accessToken,
        });

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          transferValue,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        // Assert
        expect(doPaymentResponse.status).toBe(HttpStatus.BAD_REQUEST);
        expect(doPaymentResponse.body.message).toContain(
          FspConfigurationProperties.paymentReferencePrefix,
        );
      });
    });
  });
});
