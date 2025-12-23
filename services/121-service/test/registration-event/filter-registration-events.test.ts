import { HttpStatus } from '@nestjs/common';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationEventEnum } from '@121-service/src/registration-events/enum/registration-event.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { getRegistrationEventsMonitoring } from '@121-service/test/helpers/program.helper';
import {
  createRegistrationUniques,
  getRegistrationEvents,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const updatePhoneNumber = '15005550099';

describe('Get registration events', () => {
  const programIdOcw = 3;
  const secondRegistration = {
    ...registrationVisa,
    referenceId: '2982g82bdsf89sdsd2',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrations(
      programIdOcw,
      [registrationVisa, secondRegistration],
      accessToken,
    );
  });

  describe('via /registration-events endpoint', () => {
    it('should get registration events with date parameters', async () => {
      // Arrange
      const reason = 'automated test';
      const dataToUpdate = {
        phoneNumber: updatePhoneNumber,
      };
      const expectedAttributesObject = {
        oldValue:
          registrationVisa[DefaultRegistrationDataAttributeNames.phoneNumber],
        newValue: updatePhoneNumber,
        fieldChanged: DefaultRegistrationDataAttributeNames.phoneNumber,
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

      const eventsResult = await getRegistrationEvents({
        programId: programIdOcw,
        fromDate: dateString,
        toDate: tomorrowDateString,
        referenceId: undefined,
        accessToken,
      });

      // Assert
      expect(eventsResult.statusCode).toBe(HttpStatus.OK);
      // Check if there's 2 events (1 for each registration)
      expect(eventsResult.body.data.length).toBe(2);
      // Check if the event is of the right type
      expect(eventsResult.body.data[0].type).toBe(
        RegistrationEventEnum.registrationDataChange,
      );
      for (const key of Object.keys(expectedAttributesObject)) {
        expect(eventsResult.body.data[0][key]).toEqual(
          expectedAttributesObject[key],
        );
      }
    });

    it('should return a 404 when no program events are found', async () => {
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
      const eventsResult = await getRegistrationEvents({
        programId: programIdOcw,
        fromDate: yesterdayString,
        toDate: yesterdayString,
        referenceId: undefined,
        accessToken,
      });

      // Assert
      expect(eventsResult.statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid date query parameters', async () => {
      // Arrange: Provide invalid date strings
      const invalidFields = {
        fromDate: 'not-a-date',
        toDate: 'also-not-a-date',
      };

      // Act
      const eventsResult = await getRegistrationEvents({
        ...invalidFields,
        accessToken,
        programId: programIdOcw,
      });

      // Assert
      expect(eventsResult.statusCode).toBe(HttpStatus.BAD_REQUEST);

      // Dynamically check that all invalid fields are reported in the error message
      const errorResponse = eventsResult.body;
      const faultyPropertiesInMessage = errorResponse.message.map(
        (messageObj) => messageObj.property,
      );
      // Only check for the date fields, since referenceId is optional and not validated as a date
      expect(faultyPropertiesInMessage).toEqual(Object.keys(invalidFields));
    });
  });

  describe('via /registration-events/monitoring endpoint', () => {
    beforeEach(async () => {
      // Make data change & FSP change for 1 registration
      await updateRegistration(
        programIdOcw,
        registrationVisa.referenceId,
        {
          [GenericRegistrationAttributes.preferredLanguage]:
            RegistrationPreferredLanguage.ar,
          [GenericRegistrationAttributes.programFspConfigurationName]:
            Fsps.intersolveVoucherWhatsapp,
        },
        'test',
        accessToken,
      );
      // Mark pair as unique
      await createRegistrationUniques({
        programId: programIdOcw,
        registrationIds: [2, 4], // These are the ids of the 2 imported registrations
        accessToken,
        reason: 'test',
      });
    });

    it('should not get status-change registration events', async () => {
      // Act
      const eventsResult = await getRegistrationEventsMonitoring({
        programId: programIdOcw,
        accessToken,
      });

      // Assert
      expect(eventsResult.statusCode).toBe(HttpStatus.OK);
      expect(eventsResult.body.meta.totalItems).toBe(4);
      // Check if events do not include type 'registrationStatusChange'
      expect(
        eventsResult.body.data.every(
          (event) =>
            event.type !== RegistrationEventEnum.registrationStatusChange,
        ),
      ).toBe(true);
    });

    it('should filter out registration events by fieldChanged', async () => {
      // Act
      const eventsResult = await getRegistrationEventsMonitoring({
        programId: programIdOcw,
        accessToken,
        filter: {
          'filter.fieldChanged': `$in:${[
            GenericRegistrationAttributes.programFspConfigurationName,
            'duplicateStatus',
            GenericRegistrationAttributes.preferredLanguage,
          ].join(',')}`,
        },
      });

      // Assert
      expect(eventsResult.statusCode).toBe(HttpStatus.OK);
      expect(eventsResult.body.meta.totalItems).toBe(4);
      // Check if event does include at least one for each type 'registrationDataChange','fspChange','ignoredDuplicate'
      for (const eventType of [
        RegistrationEventEnum.registrationDataChange,
        RegistrationEventEnum.fspChange,
        RegistrationEventEnum.ignoredDuplicate,
      ]) {
        expect(
          eventsResult.body.data.some((event) => event.type === eventType),
        ).toBe(true);
      }
    });
  });
});
