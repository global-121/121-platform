import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPaymentAndWaitForCompletion,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Get all payments aggregates', () => {
  let accessToken: string;
  const amount = 50;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should successfully get aggregate results for all payments in a program', async () => {
    // Arrange
    // Set up 2 registrations of which 1 fails (visa), and of which 1 has first a waiting and then a success transaction (AH voucher)

    await seedPaidRegistrations(
      registrationsPV,
      programIdPV,
      amount,
      Object.values(TransactionStatusEnum),
    );

    // Add a second payment to return two aggregates in the response
    await doPaymentAndWaitForCompletion({
      programId: programIdPV,
      amount,
      referenceIds: registrationsPV.map((r) => r.referenceId),
      accessToken,
      completeStatusses: Object.values(TransactionStatusEnum),
    });

    // Act
    const getAllPaymentsAggregatesResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/all-payments-aggregates`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    expect(getAllPaymentsAggregatesResponse.statusCode).toBe(200);
    console.log(
      '🚀 ~ getAllPaymentsAggregatesResponse:',
      getAllPaymentsAggregatesResponse.body,
    );
    // expect(getAllPaymentsAggregatesResponse.body).toEqual(
    //   expect.objectContaining({
    //     includedPeople: registrationsPV.length,
    //     newPeople: 0,
    //     programId: programIdPV,
    //     registeredPeople: registrationsPV.length,
    //     targetedPeople: 250,
    //     totalBudget: 10000,
    //   }),
    // );
  });
});
