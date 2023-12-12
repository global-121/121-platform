import { FspName } from '../../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
import { changePhase } from '../../helpers/program.helper';
import {
  getRegistrations,
  importRegistrations,
} from '../../helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenProgramManager,
  removeUserPermissions,
  resetDB,
} from '../../helpers/utility.helper';
import { programIdOCW, referenceId, registration1 } from './pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate', () => {
    let accessTokenAdmin: string;
    let accessTokenProgramManager: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessTokenAdmin = await getAccessToken();

      await changePhase(
        programIdOCW,
        ProgramPhase.registrationValidation,
        accessTokenAdmin,
      );

      await importRegistrations(
        programIdOCW,
        [registration1],
        accessTokenAdmin,
      );
      await removeUserPermissions(4, {
        label: 'Test Role',
        permissions: ['registration.read'],
      });
      accessTokenProgramManager = await getAccessTokenProgramManager();
    });

    it('should return all dynamic attributes that do not require personal.read permission', async () => {
      // Arrange
      const requestedDynamicAttributes = null;

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessTokenProgramManager,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObject = {
        referenceId: referenceId,
        preferredLanguage: registration1.preferredLanguage,
        paymentAmountMultiplier: 1,
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        financialServiceProvider: FspName.intersolveJumboPhysical,
        whatsappPhoneNumber: undefined,
        addressStreet: undefined,
        addressHouseNumber: undefined,
        addressHouseNumberAddition: undefined,
        addressPostalCode: undefined,
        addressCity: undefined,
        name: undefined,
      };

      // Assert
      for (const [key, value] of Object.entries(expectedValueObject)) {
        expect(data[0][key]).toBe(value);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should return all dynamic attributes that were selected and do not require read personal read persmission', async () => {
      // Arrange
      const requestedDynamicAttributes = [
        'name',
        'phoneNumber',
        'referenceId',
        'preferredLanguage',
      ];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessTokenProgramManager,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObject = {
        referenceId: referenceId,
        preferredLanguage: registration1.preferredLanguage,
        paymentAmountMultiplier: undefined,
        firstName: undefined,
        lastName: undefined,
        phoneNumber: undefined,
        financialServiceProvider: undefined,
        whatsappPhoneNumber: undefined,
        addressStreet: undefined,
        addressHouseNumber: undefined,
        addressHouseNumberAddition: undefined,
        addressPostalCode: undefined,
        addressCity: undefined,
        name: undefined,
      };

      // Assert
      for (const [key, value] of Object.entries(expectedValueObject)) {
        expect(data[0][key]).toBe(value);
      }
      expect(meta.totalItems).toBe(1);
    });
  });
});
