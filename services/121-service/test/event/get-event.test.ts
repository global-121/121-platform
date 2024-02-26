import { HttpStatus } from '@nestjs/common';
import { registrationVisa } from '../../seed-data/mock/visa-card.data';
import { EventEnum } from '../../src/events/enum/event.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  getEvents,
  getRegistrationEvents,
  importRegistrations,
  searchRegistrationByReferenceId,
  updateRegistration,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

const updatePhoneNumber = '15005550099';

describe('Get all events of 1 PA or by parameters', () => {
  const programIdOcw = 3;
  const secondRegistration = {
    ...registrationVisa,
    referenceId: '2982g82bdsf89sdsd2',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(
      programIdOcw,
      [registrationVisa, secondRegistration],
      accessToken,
    );
  });

  it('should get events for registration by registrationId', async () => {
    // Arrange
    const reason = 'automated test';
    const dataToUpdate = {
      phoneNumber: updatePhoneNumber,
    };
    const expectedAttributesObject = {
      oldValue: registrationVisa[CustomDataAttributes.phoneNumber],
      newValue: updatePhoneNumber,
      fieldName: CustomDataAttributes.phoneNumber,
      reason,
    };

    // Act
    await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );
    await updateRegistration(
      programIdOcw,
      secondRegistration.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOcw,
      accessToken,
    );
    const registration = result.body.data[0];

    const eventsResult = await getRegistrationEvents(programIdOcw, registration.id);

    // Assert
    expect(eventsResult.statusCode).toBe(HttpStatus.OK);
    expect(eventsResult.body.length).toBe(1);
    expect(eventsResult.body[0].type).toBe(EventEnum.registrationDataChange);
    expect(eventsResult.body[0].attributes).toEqual(expectedAttributesObject);
  });

  it('should get events with date parameters', async () => {
    // Arrange
    const reason = 'automated test';
    const dataToUpdate = {
      phoneNumber: updatePhoneNumber,
    };
    const expectedAttributesObject = {
      oldValue: registrationVisa[CustomDataAttributes.phoneNumber],
      newValue: updatePhoneNumber,
      fieldName: CustomDataAttributes.phoneNumber,
      reason,
    };
    const date = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = date.toISOString();
    const tomorrowDateString = tomorrow.toISOString();

    // Act
    await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );
    await updateRegistration(
      programIdOcw,
      secondRegistration.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );

    const eventsResult = await getEvents(
      programIdOcw,
      dateString,
      tomorrowDateString,
      undefined,
    );

    // Assert
    expect(eventsResult.statusCode).toBe(HttpStatus.OK);
    // Check if there's 2 events (1 for each registration)
    expect(eventsResult.body.length).toBe(2);
    // Check if the event is of the right type
    expect(eventsResult.body[0].type).toBe(EventEnum.registrationDataChange);
    expect(eventsResult.body[0].attributes).toEqual(expectedAttributesObject);
  });

  it('should return a 404 when no events are found', async () => {
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
      programIdOcw,
      registrationVisa.referenceId,
      dataToUpdate,
      reason,
      accessToken,
    );
    const eventsResult = await getEvents(
      programIdOcw,
      yesterdayString,
      yesterdayString, // same date makes sure no events are found
      undefined,
    );

    // Assert
    expect(eventsResult.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
});
