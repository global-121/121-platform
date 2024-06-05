import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import {
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenCvaManager,
  removePermissionsFromRole,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Load PA table', () => {
  describe(`Get registrations using paginate without "${PermissionEnum.RegistrationPersonalREAD}" permission`, () => {
    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      const accessTokenAdmin = await getAccessToken();

      await importRegistrations(
        programIdOCW,
        [registrationOCW1],
        accessTokenAdmin,
      );

      await removePermissionsFromRole(DefaultUserRole.CvaManager, [
        PermissionEnum.RegistrationPersonalREAD,
      ]);
    });

    it(`should return all dynamic attributes when none explicitly requested`, async () => {
      // Arrange
      const requestedDynamicAttributes = undefined;
      const accessTokenCvaManager = await getAccessTokenCvaManager();

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken: accessTokenCvaManager,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const expectedValueObject = {
        referenceId: registrationOCW1.referenceId,
        paymentAmountMultiplier: 1,
        preferredLanguage: registrationOCW1.preferredLanguage,
        financialServiceProvider:
          FinancialServiceProviderName.intersolveJumboPhysical,
      };
      const notExpectedValueObject = {
        firstName: registrationOCW1.firstName,
        lastName: registrationOCW1.lastName,
        phoneNumber: registrationOCW1.phoneNumber,
        whatsappPhoneNumber: registrationOCW1.whatsappPhoneNumber,
        addressStreet: registrationOCW1.addressStreet,
        addressHouseNumber: registrationOCW1.addressHouseNumber,
        addressHouseNumberAddition: registrationOCW1.addressHouseNumberAddition,
        addressPostalCode: registrationOCW1.addressPostalCode,
        addressCity: registrationOCW1.addressCity,
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
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken: accessTokenCvaManager,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      const expectedValueObject = {
        preferredLanguage: registrationOCW1.preferredLanguage,
        referenceId: registrationOCW1.referenceId,
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
    const getRegistrationsResponse = await getRegistrations({
      programId: programIdOCW,
      attributes: requestedDynamicAttributes,
      accessToken: accessTokenCvaManager,
    });
    const data = getRegistrationsResponse.body.data;
    const meta = getRegistrationsResponse.body.meta;

    const expectedValueObject = {
      preferredLanguage: registrationOCW1.preferredLanguage,
    };
    const notExpectedValueObject = {
      phoneNumber: registrationOCW1.phoneNumber,
    };

    // Assert
    expect(data[0]).toMatchObject(expectedValueObject);
    expect(data[0]).not.toMatchObject(notExpectedValueObject);
    expect(meta.totalItems).toBe(1);
  });
});
