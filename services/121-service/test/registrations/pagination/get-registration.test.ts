import { FspAttributes } from '@121-service/src/fsp-integrations/shared/enum/fsp-attributes.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  createExpectedValueObject,
  expectedAttributes,
  programIdOCW,
  registrationOCW2,
  registrationOCW3,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate', () => {
    let accessToken: string;
    const attribute1 = FspAttributes.whatsappPhoneNumber;
    const attribute2 = FspAttributes.addressCity;
    const attribute3 = 'referenceId';
    const attributeName = 'name';
    const attributeFullName = 'fullName';
    const attributeprogramFspConfigurationLabel =
      'programFspConfigurationLabel';
    const attributeProgramFspConfigurationName = 'programFspConfigurationName';

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple, __filename);
      accessToken = await getAccessToken();

      await importRegistrations(programIdOCW, [registrationOCW2], accessToken);
    });

    it('should return all dynamic attributes if param not supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = undefined;

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(data[0]).toMatchObject(
        createExpectedValueObject(registrationOCW2, 1),
      );
      for (const attribute of expectedAttributes) {
        expect(data[0]).toHaveProperty(attribute);
      }
      expect(meta.totalItems).toBe(1);
    });

    it('should only return requested dynamic attributes if param-values supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = [attribute1];

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
      });
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attribute1);
      expect(data[0]).not.toHaveProperty(attribute2);
      expect(data[0]).not.toHaveProperty(attribute3);
    });

    it('should only return full name and firstname', async () => {
      // Arrange
      const requestedDynamicAttributes = [attributeName, attributeFullName];

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
      });
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attributeName);
      expect(data[0]).toHaveProperty(attributeFullName);
      expect(data[0]).not.toHaveProperty(attribute1);
    });

    it('should only return full name', async () => {
      // Arrange
      const requestedDynamicAttributes = [attributeName];

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
      });
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attributeName);
      expect(data[0]).not.toHaveProperty(attributeFullName);
    });

    it('should only return programFspConfigurationLabel', async () => {
      // Arrange
      const requestedDynamicAttributes = [
        attributeprogramFspConfigurationLabel,
      ];

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
      });
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attributeprogramFspConfigurationLabel);
      expect(data[0]).not.toHaveProperty(attributeProgramFspConfigurationName);
    });

    it('Should return specified amount of PA per page', async () => {
      // Arrange
      const requestedDynamicAttributes = undefined;
      const programId2 = 2;

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programId2,
        attributes: requestedDynamicAttributes,
        accessToken,
      });
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data.length).toBe(0);
    });

    it('should be able to specify page attributes', async () => {
      // Arrange
      const requestedDynamicAttributes = undefined;
      await importRegistrations(programIdOCW, [registrationOCW3], accessToken);

      // Act
      const getRegistrationsResponse1 = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
        page: 1,
        limit: 1,
      });
      const data1 = getRegistrationsResponse1.body.data;
      const meta1 = getRegistrationsResponse1.body.meta;

      const getRegistrationsResponse2 = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
        page: 2,
        limit: 1,
      });
      const data2 = getRegistrationsResponse2.body.data;
      const meta2 = getRegistrationsResponse2.body.meta;

      const getRegistrationsResponseAll = await getRegistrations({
        programId: programIdOCW,
        attributes: requestedDynamicAttributes,
        accessToken,
        page: 1,
        limit: 2,
      });
      const dataAll = getRegistrationsResponseAll.body.data;
      const metaAll = getRegistrationsResponseAll.body.meta;

      // Assert

      // Registration 1
      expect(data1[0]).toMatchObject(
        createExpectedValueObject(registrationOCW2, 1),
      );
      for (const attribute of expectedAttributes) {
        expect(data1[0]).toHaveProperty(attribute);
      }
      expect(meta1.currentPage).toBe(1);
      expect(meta1.itemsPerPage).toBe(1);
      expect(meta1.totalPages).toBe(2);
      expect(meta1.totalItems).toBe(2);

      // Registration 2
      expect(data2[0]).toMatchObject(
        createExpectedValueObject(registrationOCW3, 2),
      );
      for (const attribute of expectedAttributes) {
        expect(data2[0]).toHaveProperty(attribute);
      }
      expect(meta2.currentPage).toBe(2);
      expect(meta2.itemsPerPage).toBe(1);
      expect(meta2.totalPages).toBe(2);
      expect(meta2.totalItems).toBe(2);

      // Registration All
      expect(metaAll.currentPage).toBe(1);
      expect(metaAll.itemsPerPage).toBe(2);
      expect(metaAll.totalPages).toBe(1);
      expect(metaAll.totalItems).toBe(2);
      expect(dataAll.length).toBe(2);
    });
  });
});
