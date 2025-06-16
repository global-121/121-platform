import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationAirtel } from '@121-service/test/registrations/pagination/pagination-data';

const programId = 1;
const payment = 1;
const amount = 200;

describe('Do payment', () => {
  describe('with FSP: Airtel', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.airtelProgram);
      accessToken = await getAccessToken();
    });

    describe('when create order API call gives a valid response', () => {
      it('should succesfully do a payment', async () => {
        // Arrange
        const paymentReferenceIds = [registrationAirtel.referenceId];
        await seedIncludedRegistrations(
          [registrationAirtel],
          programId,
          accessToken,
        );

        // Act
        const _doPaymentResponse = await doPayment({
          programId,
          paymentNr: payment,
          amount,
          referenceIds: paymentReferenceIds,
          accessToken,
        });

        // await waitForPaymentTransactionsToComplete({
        //   programId,
        //   paymentReferenceIds,
        //   accessToken,
        //   maxWaitTimeMs: 30_000,
        //   completeStatusses: [
        //     TransactionStatusEnum.success,
        //     TransactionStatusEnum.error,
        //     TransactionStatusEnum.waiting,
        //   ],
        // });

        // const getTransactionsBeforeCronjob = await getTransactions({
        //   programId,
        //   paymentNr: payment,
        //   registrationReferenceId: registrationAirtel.referenceId,
        //   accessToken,
        // });
        // const transactionBeforeCronJob = getTransactionsBeforeCronjob.body[0];

        // // Cronjob should update the status of the transaction
        // await runCronJobDoNedbankReconciliation();
        // await waitForPaymentTransactionsToComplete({
        //   programId,
        //   paymentReferenceIds,
        //   accessToken,
        //   maxWaitTimeMs: 6_000,
        //   completeStatusses: [
        //     TransactionStatusEnum.success,
        //     TransactionStatusEnum.error,
        //   ],
        // });

        // const getTransactionsAfterCronjob = await getTransactions({
        //   programId,
        //   paymentNr: payment,
        //   registrationReferenceId: registrationAirtel.referenceId,
        //   accessToken,
        // });
        // const transactionAfterCronJob = getTransactionsAfterCronjob.body[0];

        // const exportPaymentResponse = await exportList({
        //   programId,
        //   exportType: ExportType.payment,
        //   accessToken,
        //   options: {
        //     minPayment: 0,
        //     maxPayment: 1,
        //   },
        // });
        // const exportPayment = exportPaymentResponse.body.data[0];

        // // Assert
        // expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
        // expect(doPaymentResponse.body.applicableCount).toBe(
        //   paymentReferenceIds.length,
        // );
        // expect(doPaymentResponse.body.totalFilterCount).toBe(
        //   paymentReferenceIds.length,
        // );
        // expect(doPaymentResponse.body.nonApplicableCount).toBe(0);
        // expect(doPaymentResponse.body.sumPaymentAmountMultiplier).toBe(
        //   registrationAirtel.paymentAmountMultiplier,
        // );
        // expect(transactionBeforeCronJob.status).toBe(
        //   TransactionStatusEnum.waiting,
        // );
        // expect(transactionBeforeCronJob.errorMessage).toBe(null);
        // expect(transactionAfterCronJob.status).toBe(
        //   TransactionStatusEnum.success,
        // );
        // expect(exportPayment.nedbankVoucherStatus).toBe(
        //   NedbankVoucherStatus.REDEEMED,
        // );
        // expect(exportPayment.nedbankOrderCreateReference).toBeDefined();
        // expect(exportPayment.nedbankPaymentReference).toMatchSnapshot();
      });
    });
  });
});
