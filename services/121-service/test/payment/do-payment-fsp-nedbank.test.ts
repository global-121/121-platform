import { HttpStatus } from '@nestjs/common';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { adminOwnerDto } from '@121-service/test/fixtures/user-owner';
import {
  doPayment,
  exportList,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  runCronjobUpdateNedbankVoucherStatus,
} from '@121-service/test/helpers/utility.helper';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const payment = 1;
const amount = 200;

describe('Do payment to 1 PA', () => {
  describe('with FSP: Nedbank', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nedbankProgram);
      accessToken = await getAccessToken();
    });

    it('should succesfully pay-out', async () => {
      // Arrange
      const paymentReferenceIds = [registrationNedbank.referenceId];
      await seedIncludedRegistrations(
        [registrationNedbank],
        programId,
        accessToken,
      );

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitForPaymentTransactionsToComplete(
        programId,
        paymentReferenceIds,
        accessToken,
        30_000,
        [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
          TransactionStatusEnum.waiting,
        ],
      );

      const getTransactionsBodyBeforeCronjob = (
        await getTransactions(
          programId,
          payment,
          registrationNedbank.referenceId,
          accessToken,
        )
      ).body;

      // Cronjob should update the status of the transaction
      await runCronjobUpdateNedbankVoucherStatus();
      await waitForPaymentTransactionsToComplete(
        programId,
        paymentReferenceIds,
        accessToken,
        6_000,
        [TransactionStatusEnum.success, TransactionStatusEnum.error],
      );

      const getTransactionsBodyAfterCronjob = (
        await getTransactions(
          programId,
          payment,
          registrationNedbank.referenceId,
          accessToken,
        )
      ).body;

      const exportPayment = await exportList({
        programId,
        exportType: ExportType.payment,
        accessToken,
        options: {
          minPayment: 0,
          maxPayment: 1,
        },
      });

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
      expect(getTransactionsBodyBeforeCronjob[0].status).toBe(
        TransactionStatusEnum.waiting,
      );
      expect(getTransactionsBodyBeforeCronjob[0].errorMessage).toBe(null);
      expect(getTransactionsBodyBeforeCronjob[0].user).toMatchObject(
        adminOwnerDto,
      );
      expect(getTransactionsBodyAfterCronjob[0].status).toBe(
        TransactionStatusEnum.success,
      );
      expect(exportPayment.body.data[0].nedbankVoucherStatus).toBe(
        NedbankVoucherStatus.REDEEMED,
      );
    });

    it('should fail pay-out when debitor account number is missing', async () => {
      const registrationFailDebitorAccount = {
        ...registrationNedbank,
        fullName: 'failDebitorAccountIncorrect',
      };
      const paymentReferenceIds = [registrationFailDebitorAccount.referenceId];
      await seedIncludedRegistrations(
        [registrationFailDebitorAccount],
        programId,
        accessToken,
      );

      // Act
      const doPaymentResponse = await doPayment(
        programId,
        payment,
        amount,
        paymentReferenceIds,
        accessToken,
      );

      await waitForPaymentTransactionsToComplete(
        programId,
        paymentReferenceIds,
        accessToken,
        30_000,
        [
          TransactionStatusEnum.success,
          TransactionStatusEnum.error,
          TransactionStatusEnum.waiting,
        ],
      );

      const getTransactionsBodyBeforeCronjob = (
        await getTransactions(
          programId,
          payment,
          registrationFailDebitorAccount.referenceId,
          accessToken,
        )
      ).body;

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
        registrationFailDebitorAccount.paymentAmountMultiplier,
      );
      expect(getTransactionsBodyBeforeCronjob[0].status).toBe(
        TransactionStatusEnum.error,
      );
      expect(
        getTransactionsBodyBeforeCronjob[0].errorMessage,
      ).toMatchSnapshot();
    });
  });
});
