import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { SYSTEM_USER } from '@121-service/src/payments/transactions/transaction-events/mappers/transaction-events.mapper';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import {
  getTransactionEvents,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Do payment to 1 PA with Fsp Onafriq', () => {
  const programId = 1;
  const amount = 12327;
  const baseRegistrationOnafriq = {
    referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
    programFspConfigurationName: Fsps.onafriq,
    phoneNumber: '24311111111',
    phoneNumberPayment: '24322222222',
    preferredLanguage: LanguageEnum.en,
    paymentAmountMultiplier: 1,
    maxPayments: 6,
    firstName: 'Barbara',
    lastName: 'Floyd',
    gender: 'male',
    age: 25,
  };
  let registrationOnafriq;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.onafriqProgram, __filename);
    accessToken = await getAccessToken();
    registrationOnafriq = { ...baseRegistrationOnafriq };
  });

  it('should return all transaction events with all expected fields and correct data types', async () => {
    // Arrange
    await seedPaidRegistrations([registrationOnafriq], programId, amount);

    // Act
    // get transaction events
    const transactionId = 1; // We could fetch this dynamically via getTransactions, but for simplicity, we assume it's 1 here.
    const transactionEvents = await getTransactionEvents({
      programId,
      transactionId,
      accessToken,
    });
    const { meta, data } = transactionEvents.body;

    // Assert meta matches data
    expect(meta).toBeDefined();
    expect(meta.total).toBe(data.length);

    // Count types in data
    const typeCounts = data.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    expect(meta.count).toEqual(typeCounts);

    // Assert each event
    data.forEach((event) => {
      expect(event).toMatchObject({
        id: expect.any(Number),
        type: expect.any(String),
        created: expect.any(String),
        description: expect.any(String),
        isSuccessfullyCompleted: expect.any(Boolean),
        programFspConfigurationId: expect.any(Number),
      });

      // fspConfig is always filled
      expect(event.programFspConfigurationId).not.toBeNull();
    });

    // All callback events have user === null
    const callbackEvents = data.filter(
      (event) =>
        event.description ===
        TransactionEventDescription.onafriqCallbackReceived,
    );
    callbackEvents.forEach((event) => {
      expect(event.user).toMatchObject(SYSTEM_USER);
    });

    // All non-callback events have user as null or object with id/username
    const nonCallbackEvents = data.filter(
      (event) =>
        event.description !==
        TransactionEventDescription.onafriqCallbackReceived,
    );
    nonCallbackEvents.forEach((event) => {
      expect(event.user).toMatchObject({
        id: expect.any(Number),
        username: expect.any(String),
      });
    });

    // All failed events have errorMessage filled
    const failedEvents = data.filter(
      (event) => event.isSuccessfullyCompleted === false,
    );
    failedEvents.forEach((event) => {
      expect(event.errorMessage).toBeTruthy();
    });

    // All successful events have errorMessage null or empty string
    const successfulEvents = data.filter(
      (event) => event.isSuccessfullyCompleted === true,
    );
    successfulEvents.forEach((event) => {
      // Accepts null or empty string, adjust if you want stricter
      expect([null, '']).toContain(event.errorMessage);
    });

    // TODO. Currently we don't test if latest-event is bulk-inserted correctly in payments-execution.service. This is not so important and is hard to test.
    // Instead, add this test as part of AB#37516, where payment creation and start will be split, which offers the possibility for testing the bulk-insert in between those steps.
  });
});
