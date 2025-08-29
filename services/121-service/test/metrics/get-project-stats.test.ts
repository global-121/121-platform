import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationPV6,
  registrationPV7,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Get project stats', () => {
  let accessToken: string;
  const amount = 50;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully get correct project stats, including cashDisbursed only counting latest non-error transactions', async () => {
    // Arrange
    // Set up 2 registrations of which 1 fails (visa), and of which 1 has first a waiting and then a success transaction (AH voucher)
    registrationPV7.fullName = 'mock-fail-create-customer';
    const registrationsPV = [registrationPV6, registrationPV7];

    await seedPaidRegistrations(
      registrationsPV,
      projectIdPV,
      amount,
      Object.values(TransactionStatusEnum),
    );

    // Act
    const getProjectStatsResponse = await getServer()
      .get(`/projects/${projectIdPV}/metrics/project-stats-summary`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    expect(getProjectStatsResponse.statusCode).toBe(200);
    const expectedCashDisbursed = 1 * amount; // 1 successful payments, one failed
    expect(getProjectStatsResponse.body).toEqual(
      expect.objectContaining({
        cashDisbursed: expectedCashDisbursed,
        includedPeople: registrationsPV.length,
        newPeople: 0,
        projectId: projectIdPV,
        registeredPeople: registrationsPV.length,
        targetedPeople: 250,
        totalBudget: 10000,
      }),
    );
  });
});
