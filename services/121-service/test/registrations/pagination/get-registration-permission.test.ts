import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import { createAccessTokenWithPermissions } from '@121-service/test/helpers/utility.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Load PA table', () => {
  describe(`Get registrations using paginate without "${PermissionEnum.RegistrationPersonalREAD}" permission`, () => {
    let accessTokenPersonalReadOnly: string;
    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple, __filename);
      const accessTokenAdmin = await getAccessToken();

      await importRegistrations(
        programIdOCW,
        [registrationOCW1],
        accessTokenAdmin,
      );

      accessTokenPersonalReadOnly = await createAccessTokenWithPermissions({
        permissions: [PermissionEnum.RegistrationREAD],
        programId: programIdOCW,
        adminAccessToken: await getAccessToken(),
      });
    });

    it(`should return all dynamic attributes when none explicitly requested`, async () => {
      // Arrange
      const requestedDynamicAttributes = undefined;

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken: accessTokenPersonalReadOnly,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const expectedValueObject = {
        referenceId: registrationOCW1.referenceId,
        paymentAmountMultiplier: 1,
        preferredLanguage: registrationOCW1.preferredLanguage,
        programFspConfigurationName: Fsps.intersolveVisa,
      };
      const notExpectedValueObject = {
        fullName: registrationOCW1.fullName,
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

      const requestedDynamicAttributes = ['preferredLanguage', 'referenceId'];

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken: accessTokenPersonalReadOnly,
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
});
