import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getPayments,
  getTransactions,
} from '@121-service/test/helpers/program.helper';
import { getRegistrations } from '@121-service/test/helpers/registration.helper';
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
    await resetDB(SeedScript.nlrcMultipleMock, __filename);
    const accessToken = await getAccessToken();
    // Assert
    const programIds = [programIdOCW, programIdPV];

    for (const programId of programIds) {
      const registrationsResponse = await getRegistrations({
        programId,
        accessToken,
      });

      const paymentsResponse = await getPayments(programId, accessToken);

      for (const paymentData of paymentsResponse.body) {
        const paymentId = paymentData.paymentId;
        const transactionsResponse = await getTransactions({
          programId,
          paymentId,
          registrationReferenceId: null,
          accessToken,
        });

        // Assert
        expect(registrationsResponse.body.data.length).toBe(4);
        expect(transactionsResponse.body.length).toBe(4);
        expect(transactionsResponse.text).toContain(
          TransactionStatusEnum.success,
        );
      }
    }
  });
});
