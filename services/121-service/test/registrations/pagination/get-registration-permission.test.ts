import { FspName } from '../../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.enum';
import { PermissionEnum } from '../../../src/user/permission.enum';
import { DefaultUserRole } from '../../../src/user/user-role.enum';
import { changePhase } from '../../helpers/program.helper';
import {
  getRegistrations,
  importRegistrations,
} from '../../helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenCvaManager,
  removePermissionsFromRole,
  resetDB,
} from '../../helpers/utility.helper';

import { programIdOCW, referenceId, registration1 } from './pagination-data';

describe('Load PA table', () => {
  describe(`Get registrations using paginate without "${PermissionEnum.RegistrationPersonalREAD}" permission`, () => {
    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      const accessTokenAdmin = await getAccessToken();

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

      await removePermissionsFromRole(DefaultUserRole.CvaManager, [
        PermissionEnum.RegistrationPersonalREAD,
      ]);
    });

    it(`should return all dynamic attributes when none explicitly requested`, async () => {
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

      // Assert
      const expectedValueObject = {
        referenceId: referenceId,
        paymentAmountMultiplier: 1,
        preferredLanguage: registration1.preferredLanguage,
        financialServiceProvider: FspName.intersolveJumboPhysical,
      };
      const notExpectedValueObject = {
        firstName: registration1.firstName,
        lastName: registration1.lastName,
        phoneNumber: registration1.phoneNumber,
        whatsappPhoneNumber: registration1.whatsappPhoneNumber,
        addressStreet: registration1.addressStreet,
        addressHouseNumber: registration1.addressHouseNumber,
        addressHouseNumberAddition: registration1.addressHouseNumberAddition,
        addressPostalCode: registration1.addressPostalCode,
        addressCity: registration1.addressCity,
      };

      expect(data[0]).toMatchObject(expectedValueObject);
      expect(data[0]).not.toMatchObject(notExpectedValueObject);
      expect(meta.totalItems).toBe(1);
    });

    it(`should only return the dynamic attributes requested`, async () => {
      // Arrange
      const accessTokenCvaManager = await getAccessTokenCvaManager();
      const requestedDynamicAttributes = ['preferredLanguage', 'referenceId'];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessTokenCvaManager,
      );
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObject = {
        preferredLanguage: registration1.preferredLanguage,
        referenceId: referenceId,
      };

      // Assert
      expect(data[0]).toStrictEqual(expectedValueObject);
      expect(meta.totalItems).toBe(1);
    });
  });

  it(`should only return the dynamic attributes requested that are not "personal"`, async () => {
    // Arrange
    const accessTokenCvaManager = await getAccessTokenCvaManager();
    const requestedDynamicAttributes = ['phoneNumber', 'preferredLanguage'];

    // Act
    const getRegistrationsResponse = await getRegistrations(
      programIdOCW,
      requestedDynamicAttributes,
      accessTokenCvaManager,
    );
    const data = getRegistrationsResponse.body.data;
    const meta = getRegistrationsResponse.body.meta;

    const expectedValueObject = {
      preferredLanguage: registration1.preferredLanguage,
    };
    const notExpectedValueObject = {
      phoneNumber: registration1.phoneNumber,
    };

    // Assert
    expect(data[0]).toMatchObject(expectedValueObject);
    expect(data[0]).not.toMatchObject(notExpectedValueObject);
    expect(meta.totalItems).toBe(1);
  });
});
