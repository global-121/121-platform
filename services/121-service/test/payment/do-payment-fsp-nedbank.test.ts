import { HttpStatus } from '@nestjs/common';

import {
  FinancialServiceProviderConfigurationProperties,
  FinancialServiceProviders,
} from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ImportRegistrationsDto } from '@121-service/src/registration/dto/bulk-import.dto';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { adminOwnerDto } from '@121-service/test/fixtures/user-owner';
import {
  doPayment,
  exportList,
  getTransactions,
  retryPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { deleteProgramFinancialServiceProviderConfigurationProperty } from '@121-service/test/helpers/program-financial-service-provider-configuration.helper';
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

const programId = 1;
const payment = 1;
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
      await resetDB(SeedScript.nedbankProgram);
      accessToken = await getAccessToken();
    });

    describe('when create order API call gives a valid response', () => {
      it('should succesfully do a payment', async () => {
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
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
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
          programId,
          paymentNr: payment,
          referenceId: registrationNedbank.referenceId,
          accessToken,
        });
        const transactionBeforeCronJob = getTransactionsBeforeCronjob.body[0];

        // Cronjob should update the status of the transaction
        await runCronJobDoNedbankReconciliation();
        await waitForPaymentTransactionsToComplete({
          programId,
          paymentReferenceIds,
          accessToken,
          maxWaitTimeMs: 6_000,
          completeStatusses: [
            TransactionStatusEnum.success,
            TransactionStatusEnum.error,
          ],
        });

        const getTransactionsAfterCronjob = await getTransactions({
          programId,
          paymentNr: payment,
          referenceId: registrationNedbank.referenceId,
          accessToken,
        });
        const transactionAfterCronJob = getTransactionsAfterCronjob.body[0];

        const exportPaymentResponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const exportPayment = exportPaymentResponse.body.data[0];

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
        expect(transactionBeforeCronJob.user).toMatchObject(adminOwnerDto);
        expect(transactionAfterCronJob.status).toBe(
          TransactionStatusEnum.success,
        );
        expect(exportPayment.nedbankVoucherStatus).toBe(
          NedbankVoucherStatus.REDEEMED,
        );
        expect(exportPayment.nedbankOrderCreateReference).toBeDefined();
        expect(exportPayment.nedbankPaymentReference).toMatchSnapshot();
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
        await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
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
            programId,
            paymentNr: payment,
            referenceId: registrationFailDebitorAccount.referenceId,
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
          programId,
          accessToken,
        );

        // Act
        await doPayment({
          programId,
          paymentNr: payment,
          amount: amountOver6000,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
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
            programId,
            paymentNr: payment,
            referenceId: registrationNedbank.referenceId,
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
          programId,
          accessToken,
        );

        // Act
        await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
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
            programId,
            paymentNr: payment,
            referenceId: registrationFailPhoneNumber.referenceId,
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
          programId,
          accessToken,
        );

        // Act
        await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        await waitForPaymentTransactionsToComplete({
          programId,
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
          await exportList({
            programId,
            exportType: ExportType.payment,
            accessToken,
            options: {
              minPayment: 0,
              maxPayment: 1,
            },
          })
        ).body.data[0];

        await runCronJobDoNedbankReconciliation();

        const paymentExportAfterReconciliation = (
          await exportList({
            programId,
            exportType: ExportType.payment,
            accessToken,
            options: {
              minPayment: 0,
              maxPayment: 1,
            },
          })
        ).body.data[0];

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
        await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
        });
        await waitForPaymentTransactionsToComplete({
          programId,
          paymentReferenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
          maxWaitTimeMs: 5_000,
          completeStatusses: [TransactionStatusEnum.error],
        });
        const exportPaymentBeforeRetryResponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const orderReferenceBeforeRetry =
          exportPaymentBeforeRetryResponse.body.data[0]
            .nedbankOrderCreateReference;

        await updateRegistration(
          programId,
          registrationFailDebitorAccount.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );
        await retryPayment({ programId, paymentNr: payment, accessToken });
        await waitForPaymentTransactionsToComplete({
          programId,
          paymentReferenceIds: [registrationFailDebitorAccount.referenceId],
          accessToken,
          maxWaitTimeMs: 5000,
          completeStatusses: [TransactionStatusEnum.waiting],
        });
        const exportPaymentAfterRetryReponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const orderReferenceAfterRetry =
          exportPaymentAfterRetryReponse.body.data[0]
            .nedbankOrderCreateReference;
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
        await seedPaidRegistrations(registrations, programId);

        // Act
        await runCronJobDoNedbankReconciliation();
        const getExportListResponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const exportListData = getExportListResponse.body.data;
        for (const exportData of exportListData) {
          const expectedStatus =
            nedbanVoucherStatusToTransactionStatus[
              exportData.nedbankVoucherStatus
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
        await seedPaidRegistrations([registrationFailTimeout], programId);
        const paymentExportBeforeCronResponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const paymentExportBeforeCron =
          paymentExportBeforeCronResponse.body.data[0];

        await updateRegistration(
          programId,
          registrationFailTimeout.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );

        await runCronJobDoNedbankReconciliation();
        const paymentExportAfterCronResponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const paymentExportAfterCron =
          paymentExportAfterCronResponse.body.data[0];

        // Assert
        expect(paymentExportBeforeCron.nedbankVoucherStatus).toBe(null);
        expect(paymentExportBeforeCron.status).toBe(
          TransactionStatusEnum.waiting,
        );
        expect(paymentExportAfterCron.nedbankOrderCreateReference).toBe(
          paymentExportBeforeCron.nedbankOrderCreateReference,
        );
        expect(paymentExportAfterCron.nedbankVoucherStatus).toBe(
          NedbankVoucherStatus.REDEEMED,
        );
        expect(paymentExportAfterCron.status).toBe(
          TransactionStatusEnum.success,
        );
      });

      it('should update the transaction status to failed in the nedbank cronjob if the voucher is not found', async () => {
        // Arrange
        const registrationFailTimeout = {
          ...registrationNedbank,
          phoneNumber: NedbankMockNumber.failTimoutSimulate, // This phone number will simulate a time-out in our mock service
          referenceId: NebankGetOrderMockReference.orderNotFound, // This referenceId will be copied to the orderCreateReference and this will simulate a not found order in our mock service when we try to get the order
        };
        await seedPaidRegistrations([registrationFailTimeout], programId);
        const paymentExportBeforeCronResponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const paymentExportBeforeCron =
          paymentExportBeforeCronResponse.body.data[0];

        await updateRegistration(
          programId,
          registrationFailTimeout.referenceId,
          { phoneNumber: '27000000000' },
          'to make payment work this time',
          accessToken,
        );

        await runCronJobDoNedbankReconciliation();
        const paymentExportAfterCronResponse = await exportList({
          programId,
          exportType: ExportType.payment,
          accessToken,
          options: {
            minPayment: 0,
            maxPayment: 1,
          },
        });
        const paymentExportAfterCron =
          paymentExportAfterCronResponse.body.data[0];

        // Assert
        expect(paymentExportBeforeCron.nedbankVoucherStatus).toBe(null);
        expect(paymentExportBeforeCron.status).toBe(
          TransactionStatusEnum.waiting,
        );
        expect(paymentExportAfterCron.nedbankOrderCreateReference).toBe(
          paymentExportBeforeCron.nedbankOrderCreateReference,
        );
        expect(paymentExportAfterCron.nedbankVoucherStatus).toBe(
          NedbankVoucherStatus.FAILED,
        );
        expect(paymentExportAfterCron.status).toBe(TransactionStatusEnum.error);
        expect(paymentExportAfterCron.errorMessage).toMatchSnapshot();
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

        await deleteProgramFinancialServiceProviderConfigurationProperty({
          programId,
          configName: FinancialServiceProviders.nedbank,
          propertyName:
            FinancialServiceProviderConfigurationProperties.paymentReferencePrefix,
          accessToken,
        });

        // Act
        const doPaymentResponse = await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        // Assert
        expect(doPaymentResponse.status).toBe(HttpStatus.BAD_REQUEST);
        expect(doPaymentResponse.body.message).toContain(
          FinancialServiceProviderConfigurationProperties.paymentReferencePrefix,
        );
      });
    });
  });
});
