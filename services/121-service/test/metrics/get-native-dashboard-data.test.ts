import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPaymentAndWaitForCompletion,
  seedPaidRegistrations,
  seedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV6,
  registrationPV7,
  registrationPV8,
} from '@121-service/test/registrations/pagination/pagination-data';

let accessToken: string;
const amount = 50;

// Set up 3 registrations of which 1 succeeds (visa), 1 fails (visa with magic mock fail name) and 1 on waiting (AH voucher with magic mock nr to not get incoming message)
registrationPV7.fullName = 'mock-fail-create-customer';
const noIncomingMessagePhoneNumber = '16005550002'; // magic phone-nr to not get incoming message
registrationPV6.whatsappPhoneNumber = noIncomingMessagePhoneNumber;
const registrationsPV = [registrationPV6, registrationPV7, registrationPV8];

const seedTwoPayments = async () => {
  // Arrange
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
    referenceIds: registrationsPV.map((r: any) => r.referenceId),
    accessToken,
    completeStatusses: Object.values(TransactionStatusEnum),
  });
};

beforeEach(async () => {
  await resetDB(SeedScript.nlrcMultiple, __filename); // beforeEach to ensure no payments exist before each test
  accessToken = await getAccessToken();
});

describe('Get all payments aggregates', () => {
  describe('With 2 payments', () => {
    beforeEach(seedTwoPayments);

    it('should successfully get aggregate results for all 2 payments', async () => {
      // Act
      const getAllPaymentsAggregatesResponse = await getServer()
        .get(`/programs/${programIdPV}/metrics/all-payments-aggregates`)
        .set('Cookie', [accessToken])
        .send();

      // Assert
      expect(getAllPaymentsAggregatesResponse.statusCode).toBe(200);
      expect(getAllPaymentsAggregatesResponse.body.length).toBe(2); // one for each payment
      const aggregate = getAllPaymentsAggregatesResponse.body[1];
      const today = new Date().toISOString().split('T')[0];
      expect(aggregate.id).toEqual(2);
      expect(aggregate.date).toContain(today);
      expect(aggregate.aggregatedStatuses).toEqual(
        expect.objectContaining({
          success: expect.objectContaining({
            count: 1,
            amount,
          }),
          waiting: expect.objectContaining({
            count: 1,
            amount,
          }),
          failed: expect.objectContaining({
            count: 1,
            amount,
          }),
        }),
      );
    });

    it('should successfully aggregate results for the latest payment', async () => {
      // Act
      const getAllPaymentsAggregatesResponse = await getServer()
        .get(
          `/programs/${programIdPV}/metrics/all-payments-aggregates?limitNumberOfPayments=1`,
        )
        .set('Cookie', [accessToken])
        .send();

      // Assert
      expect(getAllPaymentsAggregatesResponse.statusCode).toBe(200);
      expect(getAllPaymentsAggregatesResponse.body.length).toBe(1); // one for each payment
      const aggregate = getAllPaymentsAggregatesResponse.body[0];
      const today = new Date().toISOString().split('T')[0];
      expect(aggregate.id).toEqual(2);
      expect(aggregate.date).toContain(today);
      expect(aggregate.aggregatedStatuses).toEqual(
        expect.objectContaining({
          success: expect.objectContaining({
            count: 1,
            amount,
          }),
          waiting: expect.objectContaining({
            count: 1,
            amount,
          }),
          failed: expect.objectContaining({
            count: 1,
            amount,
          }),
        }),
      );
    });
  });

  describe('With 0 payments', () => {
    it('should return empty object if no payments yet', async () => {
      // Arrange - only reset DB so no payments exist

      // Act
      const getAllPaymentsAggregatesResponse = await getServer()
        .get(`/programs/${programIdPV}/metrics/all-payments-aggregates`)
        .set('Cookie', [accessToken])
        .send();

      // Assert
      expect(getAllPaymentsAggregatesResponse.statusCode).toBe(200);
      expect(getAllPaymentsAggregatesResponse.body).toEqual([]);
    });
  });
});

describe('Get amount sent by month', () => {
  describe('With 2 payments', () => {
    beforeEach(seedTwoPayments);

    it('should successfully get amount sent by month', async () => {
      // Act
      const getAmountSentByMonthResponse = await getServer()
        .get(`/programs/${programIdPV}/metrics/amount-sent-by-month`)
        .set('Cookie', [accessToken])
        .send();

      // Assert
      expect(getAmountSentByMonthResponse.statusCode).toBe(200);
      expect(Object.keys(getAmountSentByMonthResponse.body).length).toBe(1); //TODO: add more months, but this requires to mock payments on different dates first
      const firstMonthKey = Object.keys(getAmountSentByMonthResponse.body)[0];
      expect(firstMonthKey).toMatch(/^\d{4}-\d{2}$/);
      expect(getAmountSentByMonthResponse.body[firstMonthKey]).toEqual({
        success: amount * 2,
        waiting: amount * 2,
        failed: amount * 2,
      });
    });

    it('should successfully get amount sent by month for the latest payment', async () => {
      // Act
      const getAmountSentByMonthResponse = await getServer()
        .get(
          `/programs/${programIdPV}/metrics/amount-sent-by-month?limitNumberOfPayments=1`,
        )
        .set('Cookie', [accessToken])
        .send();

      // Assert
      expect(getAmountSentByMonthResponse.statusCode).toBe(200);
      expect(Object.keys(getAmountSentByMonthResponse.body).length).toBe(1); //TODO: add more months, but this requires to mock payments on different dates first
      const firstMonthKey = Object.keys(getAmountSentByMonthResponse.body)[0];
      expect(firstMonthKey).toMatch(/^\d{4}-\d{2}$/);
      expect(getAmountSentByMonthResponse.body[firstMonthKey]).toEqual({
        success: amount,
        waiting: amount,
        failed: amount,
      });
    });
  });

  describe('With 0 payments', () => {
    it('should return empty object if no payments', async () => {
      // Arrange - only reset DB so no payments exist

      // Act
      const getAmountSentByMonthResponse = await getServer()
        .get(`/programs/${programIdPV}/metrics/amount-sent-by-month`)
        .set('Cookie', [accessToken])
        .send();

      // Assert
      expect(getAmountSentByMonthResponse.statusCode).toBe(200);
      expect(getAmountSentByMonthResponse.body).toEqual({});
    });
  });
});

describe('Get registration count by date', () => {
  it('should successfully get registration count by created date', async () => {
    // Arrange
    await seedRegistrations(registrationsPV, programIdPV);

    // Act
    const getRegistrationCountByDateResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/registration-count-by-date`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    expect(getRegistrationCountByDateResponse.statusCode).toBe(200);
    expect(Object.keys(getRegistrationCountByDateResponse.body).length).toBe(1); //TODO: add more dates, but this requires to mock registrations on different dates first
    const firstDateKey = Object.keys(
      getRegistrationCountByDateResponse.body,
    )[0];
    expect(firstDateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getRegistrationCountByDateResponse.body[firstDateKey]).toBe(
      registrationsPV.length,
    );
  });

  it('should return empty object if no registrations', async () => {
    // Arrange - only reset DB so no registrations exist

    // Act
    const getRegistrationCountByDateResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/registration-count-by-date`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    expect(getRegistrationCountByDateResponse.statusCode).toBe(200);
    expect(getRegistrationCountByDateResponse.body).toEqual({});
  });
});
