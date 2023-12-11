import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
import { changePhase } from '../../helpers/program.helper';
import {
  getRegistrations,
  importRegistrations,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  expectedAttributes,
  expectedValueObject1,
  expectedValueObject2,
  programIdOCW,
  registration1,
  registration2,
} from './pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate', () => {
    let accessToken: string;
    const attribute1 = 'whatsappPhoneNumber';
    const attribute2 = 'addressCity';
    const attribute3 = 'referenceId';
    const attributeName = 'name';
    const attributeFirstName = 'firstName';
    const attributeLastName = 'lastName';

    beforeAll(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await changePhase(
        programIdOCW,
        ProgramPhase.registrationValidation,
        accessToken,
      );

      await importRegistrations(programIdOCW, [registration1], accessToken);
    });

    it('should return all dynamic attributes if param not supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = null;

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessToken,
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

    it('should only return requested dynamic attributes if param-values supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = [attribute1];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessToken,
      );
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attribute1);
      expect(data[0]).not.toHaveProperty(attribute2);
      expect(data[0]).not.toHaveProperty(attribute3);
    });

    it('should only return full name and firstname', async () => {
      // Arrange
      const requestedDynamicAttributes = [attributeName, attributeFirstName];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessToken,
      );
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attributeName);
      expect(data[0]).toHaveProperty(attributeFirstName);
      expect(data[0]).not.toHaveProperty(attributeLastName);
    });

    it('should only return full name', async () => {
      // Arrange
      const requestedDynamicAttributes = [attributeName];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessToken,
      );
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data[0]).toHaveProperty(attributeName);
      expect(data[0]).not.toHaveProperty(attributeFirstName);
      expect(data[0]).not.toHaveProperty(attributeLastName);
    });

    it('Should return specified amount of PA per page', async () => {
      // Arrange
      const requestedDynamicAttributes = null;
      const programId2 = 2;

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId2,
        requestedDynamicAttributes,
        accessToken,
      );
      const data = getRegistrationsResponse.body.data;

      // Assert
      expect(data.length).toBe(0);
    });

    it('should be able to specify page attributes', async () => {
      // Arrange
      const requestedDynamicAttributes = null;
      await importRegistrations(programIdOCW, [registration2], accessToken);

      // Act
      const getRegistrationsResponse1 = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessToken,
        1,
        1,
      );
      const data1 = getRegistrationsResponse1.body.data;
      const meta1 = getRegistrationsResponse1.body.meta;

      const getRegistrationsResponse2 = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessToken,
        2,
        1,
      );
      const data2 = getRegistrationsResponse2.body.data;
      const meta2 = getRegistrationsResponse2.body.meta;

      const getRegistrationsResponseAll = await getRegistrations(
        programIdOCW,
        requestedDynamicAttributes,
        accessToken,
        1,
        2,
      );
      const dataAll = getRegistrationsResponseAll.body.data;
      const metaAll = getRegistrationsResponseAll.body.meta;

      // Assert

      // Registration 1
      expect(data1[0]).toMatchObject(expectedValueObject1);
      for (const attribute of expectedAttributes) {
        expect(data1[0]).toHaveProperty(attribute);
      }
      expect(meta1.currentPage).toBe(1);
      expect(meta1.itemsPerPage).toBe(1);
      expect(meta1.totalPages).toBe(2);
      expect(meta1.totalItems).toBe(2);

      // Registration 2
      expect(data2[0]).toMatchObject(expectedValueObject2);
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
