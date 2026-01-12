import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getPaymentEvents,
  retryPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  doPaymentAndWaitForCompletion,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

let accessToken: string;

describe('Payment Events API', () => {
  const programId = 1;
  const transferValue = 15;

  beforeEach(async () => {
    await resetDB(SeedScript.safaricomProgram, __filename);
    accessToken = await getAccessToken();
  });

  it('should return payment events for a payment that has successfully been retried', async () => {
    // Arrange
    const note = '121 is great!';
    // first seed a registration that will fail
    registrationSafaricom.phoneNumber = '254000000000';
    await seedIncludedRegistrations(
      [registrationSafaricom],
      programId,
      accessToken,
    );
    const paymentId = await doPaymentAndWaitForCompletion({
      programId,
      transferValue,
      referenceIds: [registrationSafaricom.referenceId],
      accessToken,
      note,
      completeStatuses: [
        TransactionStatusEnum.success,
        TransactionStatusEnum.error,
      ],
    });
    // then update and retry
    await updateRegistration(
      programId,
      registrationSafaricom.referenceId,
      { phoneNumber: '254708374149' }, // change to a number that will succeed
      'test reason',
      accessToken,
    );
    await retryPayment({
      programId,
      paymentId,
      accessToken,
    });
    await waitForPaymentAndTransactionsToComplete({
      programId,
      paymentReferenceIds: [registrationSafaricom.referenceId],
      accessToken,
      maxWaitTimeMs: 4000,
      completeStatuses: [TransactionStatusEnum.success],
    });

    // Act
    const paymentEventsResponse = await getPaymentEvents({
      programId,
      paymentId,
      accessToken,
    });

    // Assert
    expect(paymentEventsResponse.statusCode).toBe(HttpStatus.OK);

    // Check meta structure
    const { meta, data } = paymentEventsResponse.body;
    expect(meta).toMatchObject({
      count: expect.objectContaining({
        [PaymentEvent.created]: 1,
        [PaymentEvent.approved]: 1,
        [PaymentEvent.started]: 1,
        [PaymentEvent.retry]: 1,
        [PaymentEvent.note]: 1,
      }),
      total: 5,
    });

    // Check data structure
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBe(5);

    // Check that we have a 'created' event
    const createdEvent = data.find(
      (event: any) => event.type === PaymentEvent.created,
    );
    expect(createdEvent).toMatchObject({
      id: expect.any(Number),
      type: PaymentEvent.created,
      user: {
        id: expect.any(Number),
        username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      },
      created: expect.any(String),
    });

    // Check that we have a 'started' event
    const startedEvent = data.find(
      (event: any) => event.type === PaymentEvent.started,
    );
    expect(startedEvent).toMatchObject({
      id: expect.any(Number),
      type: PaymentEvent.started,
      user: {
        id: expect.any(Number),
        username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      },
      created: expect.any(String),
    });

    // Check that we have a 'retry' event
    const retryEvent = data.find(
      (event: any) => event.type === PaymentEvent.retry,
    );
    expect(retryEvent).toMatchObject({
      id: expect.any(Number),
      type: PaymentEvent.retry,
      user: {
        id: expect.any(Number),
        username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      },
      created: expect.any(String),
    });

    // Check for 'note' event
    const noteEvent = data.find(
      (event: { type: string }) => event.type === PaymentEvent.note,
    );
    expect(noteEvent).toMatchObject({
      id: expect.any(Number),
      type: PaymentEvent.note,
      user: {
        id: expect.any(Number),
        username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      },
      attributes: {
        note,
      },
    });
  });
});
