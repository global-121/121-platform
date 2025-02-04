import { HttpStatus } from '@nestjs/common';

import { EventEnum } from '@121-service/src/events/enum/event.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  deleteRegistrations,
  getEvents,
  importRegistrations,
  searchRegistrationByReferenceId,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Delete PA', () => {
  const programId = 3;
  let accessToken: string;
  const reason = 'automated test';

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });
  beforeEach(async () => {
    await importRegistrations(programId, [registrationVisa], accessToken);
  });

  it('should not delete unknown registrations', async () => {
    // Arrange
    const wrongReferenceId = registrationVisa.referenceId + '-fail-test';

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

  it('should succesfully delete', async () => {
    const rightReferenceId = registrationVisa.referenceId;

    // Act
    const response = await deleteRegistrations({
      programId,
      referenceIds: [rightReferenceId],
      accessToken,
      reason,
    });
    const registration = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    const eventsResponse = await getEvents(programId);
    const deleteEvent = eventsResponse.body[0];

    // Assert
    expect(response.statusCode).toBe(HttpStatus.ACCEPTED);

    // You cannot find deleted PAs on get registration
    expect(registration.body.data.length).toBe(0);

    // An event should be created
    const expectedDeleteEvent = {
      type: EventEnum.registrationStatusChange,
      attributes: {
        oldValue: RegistrationStatusEnum.registered,
        newValue: RegistrationStatusEnum.deleted,
        reason,
      },
    };
    expect(deleteEvent).toMatchObject(expectedDeleteEvent);
  });
});
