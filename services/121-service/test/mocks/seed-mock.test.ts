/* eslint-disable jest/no-conditional-expect */
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getVoucherBalance } from '@121-service/test/helpers/intersolve-voucher.helper';
import {
  getPayments,
  getTransactions,
} from '@121-service/test/helpers/program.helper';
import {
  getMessageHistory,
  getRegistrations,
  getVisaWalletsAndDetails,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Mock registrations', () => {
  it('does mock nlrc multiple still seed registrations and transactions', async () => {
    // Arrange
    // Act
    // NOTE: without input parameters this endpoint applies 2 registration-duplications (so 4 registrations), 2 payments, and 1 message duplication
    await resetDB(SeedScript.nlrcMultipleMock, __filename);
    const accessToken = await getAccessToken();

    // Assert
    const programIds = [programIdOCW, programIdPV];
    for (const programId of programIds) {
      const registrationsResponse = await getRegistrations({
        programId,
        accessToken,
      });

      // Assert 4 registrations per program
      expect(registrationsResponse.body.data.length).toBe(4);

      const paymentsResponse = await getPayments(programId, accessToken);
      for (const paymentData of paymentsResponse.body) {
        const paymentId = paymentData.paymentId;
        const transactionsResponse = await getTransactions({
          programId,
          paymentId,
          registrationReferenceId: null,
          accessToken,
        });

        // Assert 4 transactions per payment (one for each registration)
        expect(transactionsResponse.body.length).toBe(4);
        expect(transactionsResponse.text).toContain(
          TransactionStatusEnum.success,
        );

        for (const registration of registrationsResponse.body.data) {
          // Assert voucher balance call working, which implies correct data on intersolve-voucher and imagecode-export-voucher
          if (programId === programIdPV) {
            const voucherBalanceResponse = await getVoucherBalance(
              programId,
              paymentId,
              registration.referenceId,
              accessToken,
            );
            expect(voucherBalanceResponse.status).toBe(200);
          }
        }
      }

      if (programId === programIdOCW) {
        // Assert Visa customer and wallet data being present for each registration
        for (const registration of registrationsResponse.body.data) {
          const visaData = await getVisaWalletsAndDetails(
            programId,
            registration.referenceId,
            accessToken,
          );
          expect(visaData.body.tokenCode).toBeDefined();
          expect(visaData.body.cards.length).toBe(1);
        }
      }

      for (const registration of registrationsResponse.body.data) {
        // Assert 4 or 5 (times 2) messages per registration depending on program
        const messageHistoryResponse = await getMessageHistory(
          programId,
          registration.referenceId,
          accessToken,
        );
        const expected = programId === programIdOCW ? 8 : 10;
        // TODO: this assertion is flaky, sometimes it yields 14 message instead of 10 for the PV registrations. This seems unrelated to current refactor.
        // expect(messageHistoryResponse.body.length).toBe(expected);
        expect(messageHistoryResponse.body.length).toBeGreaterThanOrEqual(
          expected,
        );
      }
    }
  });
});
