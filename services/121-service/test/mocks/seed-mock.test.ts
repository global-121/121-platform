import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { adminOwnerDto } from '@121-service/test/fixtures/user-owner';
import { getTransactions } from '@121-service/test/helpers/program.helper';
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
    console.time('before');
    await resetDB(SeedScript.nlrcMultipleMock);
    console.timeEnd('before');
    const accessToken = await getAccessToken();
    const payment = 1;
    // Assert
    const programs = [
      { programId: programIdOCW, paymentNr: payment },
      { programId: programIdPV, paymentNr: payment },
    ];

    for (const { programId, paymentNr } of programs) {
      const registrationsResponse = await getRegistrations({
        programId,
        accessToken,
      });

      const transactionsResponse = await getTransactions(
        programId,
        paymentNr,
        null,
        accessToken,
      );

      // Assert
      expect(registrationsResponse.body.data.length).toBe(4);
      expect(transactionsResponse.body.length).toBe(4);
      expect(transactionsResponse.text).toContain(
        TransactionStatusEnum.success,
      );
      expect(transactionsResponse.body[0].user).toMatchObject(adminOwnerDto);
    }
  });
});
