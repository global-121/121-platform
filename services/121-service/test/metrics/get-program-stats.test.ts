import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
  registrationPV7,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Get program stats', () => {
  let accessToken: string;
  const paymentNr = 1;
  const amount = 50;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully get correct program stats, including cashDisbursed only counting latest waiting/success transactions', async () => {
    // Arrange
    // Set up 3 registrations of which 1 fails, and of which 1 has first a waiting and then a success transaction (default in AH voucher)
    registrationPV5.whatsappPhoneNumber = '15005550001'; // trigger an error transaction for an AH voucher whatsapp registration with this magic mock number (MockPhoneNumbers.FailGeneric)
    const registrationsPV = [registrationPV5, registrationPV6, registrationPV7];

    await seedPaidRegistrations(
      registrationsPV,
      programIdPV,
      paymentNr,
      amount,
      Object.values(TransactionStatusEnum),
    );

    // Act
    const getProgramStatsResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/program-stats-summary`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    expect(getProgramStatsResponse.statusCode).toBe(200);
    const expectedCashDisbursed = 2 * amount; // 2 successful payments, one failed
    expect(getProgramStatsResponse.body).toEqual(
      expect.objectContaining({
        cashDisbursed: expectedCashDisbursed,
        includedPeople: registrationsPV.length,
        newPeople: 0,
        programId: programIdPV,
        registeredPeople: registrationsPV.length,
        targetedPeople: 250,
        totalBudget: 10000,
      }),
    );
  });
});
