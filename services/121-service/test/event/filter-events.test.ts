import { HttpStatus } from '@nestjs/common';

import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  getEvents,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const updatePhoneNumber = '15005550099';

describe('Get events', () => {
  const projectIdOcw = 3;
  const secondRegistration = {
    ...registrationVisa,
    referenceId: '2982g82bdsf89sdsd2',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrations(
      projectIdOcw,
      [registrationVisa, secondRegistration],
      accessToken,
    );
  });

  it('should get project events with date parameters', async () => {
    // Arrange
    const reason = 'automated test';
    const dataToUpdate = {
      phoneNumber: updatePhoneNumber,
    };
    const expectedAttributesObject = {
      oldValue:
        registrationVisa[DefaultRegistrationDataAttributeNames.phoneNumber],
      newValue: updatePhoneNumber,
      fieldName: DefaultRegistrationDataAttributeNames.phoneNumber,
      reason,
    };
    const date = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = date.toISOString();
    const tomorrowDateString = tomorrow.toISOString();

    // Act
    await updateRegistration(
      projectIdOcw,
      registrationVisa.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );
    await updateRegistration(
      projectIdOcw,
      secondRegistration.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );

    const eventsResult = await getEvents({
      projectId: projectIdOcw,
      fromDate: dateString,
      toDate: tomorrowDateString,
      referenceId: undefined,
      accessToken,
    });

    // Assert
    expect(eventsResult.statusCode).toBe(HttpStatus.OK);
    // Check if there's 2 events (1 for each registration)
    expect(eventsResult.body.length).toBe(2);
    // Check if the event is of the right type
    expect(eventsResult.body[0].type).toBe(
      RegistrationEventEnum.registrationDataChange,
    );
    expect(eventsResult.body[0].attributes).toEqual(expectedAttributesObject);
  });

  it('should return a 404 when no project events are found', async () => {
    // Arrange
    const reason = 'automated test';
    const dataToUpdate = {
      phoneNumber: updatePhoneNumber,
    };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString();

    // Act
    await updateRegistration(
      projectIdOcw,
      registrationVisa.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );
    const eventsResult = await getEvents({
      projectId: projectIdOcw,
      fromDate: yesterdayString,
      toDate: yesterdayString,
      referenceId: undefined,
      accessToken,
    });

    // Assert
    expect(eventsResult.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
