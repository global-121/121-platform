import { HttpStatus } from '@nestjs/common';

import {
  FspConfigurationProperties,
  Fsps,
} from '@121-service/src/fsps/enums/fsp-name.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ImportRegistrationsDto } from '@121-service/src/registration/dto/bulk-import.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  exportTransactionsByDateRangeJson,
  getTransactions,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import { deleteProjectFspConfigurationProperty } from '@121-service/test/helpers/project-fsp-configuration.helper';
import {
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

const projectId = 1;
const amount = 200;

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
      await resetDB(SeedScript.nedbankProject, __filename);
      accessToken = await getAccessToken();
    });

    describe('when create order API call gives a valid response', () => {
      it('should succesfully do a payment', async () => {
        // Arrange
        const paymentReferenceIds = [registrationNedbank.referenceId];
        await seedIncludedRegistrations(
          [registrationNedbank],
          projectId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          projectId,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        const getTransactionsBeforeCronjob = await getTransactions({
          projectId,
          paymentId,
          registrationReferenceId: registrationNedbank.referenceId,
          accessToken,
        });
        const transactionBeforeCronJob = getTransactionsBeforeCronjob.body[0];

        // Cronjob should update the status of the transaction
        await runCronJobDoNedbankReconciliation();
        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 6_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        const getTransactionsAfterCronjob = await getTransactions({
          projectId,
          paymentId,
          registrationReferenceId: registrationNedbank.referenceId,
          accessToken,
        });
        const transactionAfterCronJob = getTransactionsAfterCronjob.body[0];

        const exportTransactionResponse =
          await exportTransactionsByDateRangeJson({
            projectId,
            accessToken,
          });

        const transaction = exportTransactionResponse[0];

        // Assert
        expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
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
          projectId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          projectId,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        const getTransactionsBody = (
          await getTransactions({
            projectId,
            paymentId,
            registrationReferenceId: registrationFailDebitorAccount.referenceId,
            accessToken,
          })
        ).body;

        // Assert
        expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.error);
        expect(getTransactionsBody[0].errorMessage).toMatchSnapshot();
      });

      it('should create a transaction with status error when we make a payment with a payment amount of over 5000', async () => {
        const amountOver6000 = 6000;
        const paymentReferenceIds = [registrationNedbank.referenceId];
        await seedIncludedRegistrations(
          [registrationNedbank],
          projectId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          projectId,
          amount: amountOver6000,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        const getTransactionsBody = (
          await getTransactions({
            projectId,
            paymentId,
            registrationReferenceId: registrationNedbank.referenceId,
            accessToken,
          })
        ).body;

        // Assert
        expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.error);
        expect(getTransactionsBody[0].errorMessage).toMatchSnapshot();
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
          projectId,
          accessToken,
        );

        // Act
        const doPaymentResponse = await doPayment({
          projectId,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;

        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        await runCronJobDoNedbankReconciliation();

        const getTransactionsBody = (
          await getTransactions({
            projectId,
            paymentId,
            registrationReferenceId: registrationFailPhoneNumber.referenceId,
            accessToken,
          })
        ).body;

        // Assert
        expect(getTransactionsBody[0].status).toBe(TransactionStatusEnum.error);
        expect(getTransactionsBody[0].errorMessage).toMatchSnapshot();
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
          projectId,
          accessToken,
        );

        // Act
        await doPayment({
          projectId,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 30_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
            TransactionStatusEnum.waiting,
          ],
        });

        const paymentExportBeforeReconciliation = (
          await exportTransactionsByDateRangeJson({
            projectId,
            accessToken,
          })
        )[0];

        await runCronJobDoNedbankReconciliation();
        const paymentExportAfterReconciliation = (
          await exportTransactionsByDateRangeJson({
            projectId,
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
          projectId,
          accessToken,
        );
        const doPaymentResponse = await doPayment({
          projectId,
          amount,
          referenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
        });
        const paymentId = doPaymentResponse.body.id;
        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
          maxWaitTimeMs: 5_000,
          completeStatusses: [TransactionStatusEnum.error],
        });
        const exportPaymentBeforeRetryResponse =
          await exportTransactionsByDateRangeJson({
            projectId,
            accessToken,
          });

        const orderReferenceBeforeRetry =
          exportPaymentBeforeRetryResponse[0].nedbankOrderCreateReference;

        await updateRegistration(
          projectId,
          registrationFailDebitorAccount.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );
        await retryPayment({
          projectId,
          paymentId,
          accessToken,
        });
        await waitForPaymentTransactionsToComplete({
          projectId,
          paymentReferenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
          maxWaitTimeMs: 5000,
          completeStatusses: [TransactionStatusEnum.waiting],
        });
        const exportPaymentAfterRetryReponse =
          await exportTransactionsByDateRangeJson({
            projectId,
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
        await seedPaidRegistrations(registrations, projectId);

        // Act
        await runCronJobDoNedbankReconciliation();
        const getExportTransactionsResponse =
          await exportTransactionsByDateRangeJson({
            projectId,
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
      it('should update the transaction status to succes in reconciliation process if the voucher is redeemed', async () => {
        // Arrange
        const registrationFailTimeout = {
          ...registrationNedbank,
          phoneNumber: NedbankMockNumber.failTimoutSimulate, // This phone number will simulate a time-out in our mock service
        };

        // Act
        await seedPaidRegistrations([registrationFailTimeout], projectId);
        const transactionsExportBeforeCronResponse =
          await exportTransactionsByDateRangeJson({
            projectId,
            accessToken,
          });

        const transactionBeforeCron = transactionsExportBeforeCronResponse[0];

        await updateRegistration(
          projectId,
          registrationFailTimeout.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );

        await runCronJobDoNedbankReconciliation();
        const transactionExportAfterCronResponse =
          await exportTransactionsByDateRangeJson({
            projectId,
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
        await seedPaidRegistrations([registrationFailTimeout], projectId);
        const transactionExportBeforeCronResponse =
          await exportTransactionsByDateRangeJson({
            projectId,
            accessToken,
          });

        const transactionBeforeCron = transactionExportBeforeCronResponse[0];

        await updateRegistration(
          projectId,
          registrationFailTimeout.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );

        await runCronJobDoNedbankReconciliation();
        const transactionExportAfterCronResponse =
          await exportTransactionsByDateRangeJson({
            projectId,
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

    describe('when project financial service configuration is not set properly', () => {
      it('should fail payment by nedbank if paymentReferencePrefix is not configured for the project', async () => {
        // Arrange
        await seedIncludedRegistrations(
          [registrationNedbank],
          projectId,
          accessToken,
        );
        const paymentReferenceIds = [registrationNedbank.referenceId];

        await deleteProjectFspConfigurationProperty({
          projectId,
          configName: Fsps.nedbank,
          propertyName: FspConfigurationProperties.paymentReferencePrefix,
          accessToken,
        });

        // Act
        const doPaymentResponse = await doPayment({
          projectId,
          amount,
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
