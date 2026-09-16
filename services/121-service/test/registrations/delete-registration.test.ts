import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  deleteRegistrations,
  getRegistrationEvents,
  importRegistrations,
  searchRegistrationByReferenceId,
  waitForDeleteRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Delete PA', () => {
  const programId = 3;
  let accessToken: string;
  const reason = 'automated test';

  const registrationVisa1 = {
    ...registrationVisa,
    referenceId: `${registrationVisa.referenceId}-1`,
  };
  const registrationVisa2 = {
    ...registrationVisa,
    referenceId: `${registrationVisa.referenceId}-2`,
  };

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
    await importRegistrations(
      programId,
      [registrationVisa1, registrationVisa2],
      accessToken,
    );
  });

  it('should not delete unknown registrations', async () => {
    // Arrange
    const wrongReferenceId = 'non-existing-reference-id';

    // Act
    const response = await deleteRegistrations({
      programId,
      referenceIds: [wrongReferenceId],
      accessToken,
      reason,
    });

    // Assert
    expect(response.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(response.body.totalFilterCount).toBe(0);
    expect(response.body.applicableCount).toBe(0);
  });

  it('should successfully delete', async () => {
    const rightReferenceId = registrationVisa2.referenceId;

    // Act
    const response = await deleteRegistrations({
      programId,
      referenceIds: [rightReferenceId],
      accessToken,
      reason,
    });
    await waitForDeleteRegistrations({
      programId,
      referenceIds: [rightReferenceId],
    });
    const registration = await searchRegistrationByReferenceId(
      rightReferenceId,
      programId,
      accessToken,
    );
    const eventsResponse = await getRegistrationEvents({
      programId,
      referenceId: rightReferenceId,
      accessToken,
    });
    const deleteEvent = eventsResponse.body.data.find(
      (event: {
        type: RegistrationEventEnum;
        newValue: RegistrationStatusEnum;
      }) =>
        event.type === RegistrationEventEnum.registrationStatusChange &&
        event.newValue === RegistrationStatusEnum.deleted,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.ACCEPTED);

    // You cannot find deleted PAs on get registration
    expect(registration.body.data.length).toBe(0);

    // An event should be created
    const expectedDeleteEvent = {
      type: RegistrationEventEnum.registrationStatusChange,
      oldValue: RegistrationStatusEnum.new,
      newValue: RegistrationStatusEnum.deleted,
      reason,
    };
    expect(deleteEvent).toMatchObject(expectedDeleteEvent);
  });
});
