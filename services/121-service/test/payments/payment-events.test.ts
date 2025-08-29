import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getPaymentEvents } from '@121-service/test/helpers/project.helper';
import {
  doPaymentAndWaitForCompletion,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

let accessToken: string;

describe('Payment Events API', () => {
  const projectId = 1;
  const amount = 15;

  beforeEach(async () => {
    await resetDB(SeedScript.safaricomProject, __filename);
    accessToken = await getAccessToken();
  });

  it('should return payment events for a successful payment', async () => {
    // Arrange
    const note = '121 is great!';
    await seedIncludedRegistrations(
      [registrationSafaricom],
      projectId,
      accessToken,
    );

    const paymentId = await doPaymentAndWaitForCompletion({
      projectId,
      amount,
      referenceIds: [registrationSafaricom.referenceId],
      accessToken,
      note,
    });

    // Act
    const paymentEventsResponse = await getPaymentEvents({
      projectId,
      paymentId,
      accessToken,
    });

    // Assert
    expect(paymentEventsResponse.statusCode).toBe(HttpStatus.OK);

    // Check meta structure
    const { meta, data } = paymentEventsResponse.body;
    expect(meta).toMatchObject({
      availableTypes: expect.arrayContaining([
        PaymentEvent.created,
        PaymentEvent.note,
      ]),
      count: expect.objectContaining({
        [PaymentEvent.created]: 1,
        [PaymentEvent.note]: 1,
      }),
      total: 2,
    });

    // Check data structure
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBe(2);

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
