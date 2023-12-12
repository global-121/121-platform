import { RegistrationStatusEnum } from '../../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
import { changePhase } from '../../helpers/program.helper';
import {
  awaitChangePaStatus,
  getRegistrations,
  importRegistrations,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  expectedAttributes,
  expectedValueObject1,
  expectedValueObject3,
  expectedValueObject4,
  programIdOCW,
  registration1,
  registration2,
  registration3,
  registration4,
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
        [registration1, registration2, registration3, registration4],
        accessToken,
      );

      await awaitChangePaStatus(
        programIdOCW,
        [registration1.referenceId],
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
      expect(data[0]).toMatchObject(expectedValueObject1);
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
        { 'filter.whatsappPhoneNumber': registration4.whatsappPhoneNumber },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(expectedValueObject4);
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
          'filter.whatsappPhoneNumber': registration3.whatsappPhoneNumber,
          'filter.preferredLanguage': registration3.preferredLanguage,
        },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(expectedValueObject3);
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
          'filter.whatsappPhoneNumber': `$ilike:${registration3.whatsappPhoneNumber.substring(
            0,
            1,
          )}`,
          'filter.preferredLanguage': `$in:nonExisting,${registration3.preferredLanguage}`,
          'filter.addressCity': `$eq:${registration3.addressCity}`,
        },
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(expectedValueObject3);
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });
  });
});
