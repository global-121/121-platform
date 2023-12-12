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
  getAccessTokenCvaManager,
  updatePermissionsOfRole,
  resetDB,
} from '../../helpers/utility.helper';
import { programIdOCW, referenceId, registration1 } from './pagination-data';

describe('Load PA table', () => {
  describe('Get registrations using paginate without registration:personal.read permission', () => {
    let accessTokenAdmin: string;

    beforeAll(async () => {
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

      const cvaManagerUserRoleId = 5;
      const newPermissions = ['registration.read'];
      await updatePermissionsOfRole(cvaManagerUserRoleId, {
        label: 'Test Role',
        permissions: newPermissions,
      });
    });

    it('should return all dynamic attributes that do not require registration:personal.read permission', async () => {
      // Arrange
      const requestedDynamicAttributes = null;
      const accessTokenCvaManager = await getAccessTokenCvaManager();

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessTokenCvaManager,
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
      expect(data[0]).toMatchObject(expectedValueObject);
      expect(meta.totalItems).toBe(1);
    });

    it('should return all dynamic attributes that were selected and do not require registration:personal.read permission', async () => {
      // Arrange
      const accessTokenCvaManager = await getAccessTokenCvaManager();
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
        accessTokenCvaManager,
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
      expect(data[0]).toMatchObject(expectedValueObject);
      expect(meta.totalItems).toBe(1);
    });
  });
});
