import { RegistrationStatusEnum } from '../../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.enum';
import { changePhase } from '../../helpers/program.helper';
import {
  awaitChangePaStatus,
  getRegistrations,
  importRegistrations,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  createExpectedValueObject,
  expectedAttributes,
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from './pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate', () => {
    let accessToken: string;

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await changePhase(
        programIdOCW,
        ProgramPhase.registrationValidation,
        accessToken,
      );

      await importRegistrations(
        programIdOCW,
        [
          registrationOCW1,
          registrationOCW2,
          registrationOCW3,
          registrationOCW4,
        ],
        accessToken,
      );

      await awaitChangePaStatus(
        programIdOCW,
        [registrationOCW1.referenceId],
        RegistrationStatusEnum.included,
        accessToken,
      );
    });

    it('should filter based on status', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        { 'filter.status': RegistrationStatusEnum.included },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW1, 1),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on registration data', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        { 'filter.whatsappPhoneNumber': registrationOCW4.whatsappPhoneNumber },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW4, 4),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter based on root attributes & registration data', async () => {
      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        {
          'filter.whatsappPhoneNumber': registrationOCW3.whatsappPhoneNumber,
          'filter.preferredLanguage': registrationOCW3.preferredLanguage,
        },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW3, 3),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter using in, eq, ilike and null', async () => {
      // Act
      // Each of the filters would seperately return
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        {
          'filter.whatsappPhoneNumber': `$ilike:${registrationOCW3.whatsappPhoneNumber.substring(
            0,
            1,
          )}`,
          'filter.preferredLanguage': `$in:nonExisting,${registrationOCW3.preferredLanguage}`,
          'filter.addressCity': `$eq:${registrationOCW3.addressCity}`,
        },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW3, 3),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should filter using search in combination with filter', async () => {
      // Act
      // The postal code shoud filter 1 and 2 and the search should filter 2 and 4, so only 2 should be returned
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        {
          'filter.addressPostalCode': `$ilike:${registrationOCW2.addressPostalCode.substring(
            0,
            1,
          )}`,
          search: `${registrationOCW2.addressCity}`,
        },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW2, 2),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });
  });
});
