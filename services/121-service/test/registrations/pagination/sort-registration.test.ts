import { CreateProgramRegistrationAttributeDto } from '@121-service/src/programs/dto/program-registration-attribute.dto';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { postProgramRegistrationAttribute } from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  getRegistrations,
  importRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Load PA table', () => {
  describe('getting registration using paginate', () => {
    let accessToken: string;

    beforeAll(async () => {
      await resetDB({ seedScript: SeedScript.nlrcMultiple });
      accessToken = await getAccessToken();

      await importRegistrations(
        programIdOCW,
        [
          // Unordered on purpose, to test sorting/ordering later
          registrationOCW1, // Sequence number: 1
          registrationOCW3, // Sequence number: 2
          registrationOCW4, // Sequence number: 3
          registrationOCW2, // Sequence number: 4
        ],
        accessToken,
      );

      await awaitChangeRegistrationStatus({
        programId: programIdOCW,
        referenceIds: [registrationOCW1.referenceId],
        status: RegistrationStatusEnum.included,
        accessToken,
      });
    });

    it('should sort based on registration root data', async () => {
      // Arrange
      const field = 'paymentAmountMultiplier';
      const direction = 'DESC';

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        sort: { field, direction },
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const orderedInput = [
        registrationOCW1,
        registrationOCW2,
        registrationOCW3,
        registrationOCW4,
      ].sort((a, b) => (a[field] < b[field] ? 1 : -1)); // DESC

      expect(data[0][field]).toBe(orderedInput[0][field]);
      expect(data[1][field]).toBe(orderedInput[1][field]);
      expect(data[2][field]).toBe(orderedInput[2][field]);
      expect(data[3][field]).toBe(orderedInput[3][field]);
      expect(meta.totalItems).toBe(4);
    });

    it('should sort based on registration data', async () => {
      // Arrange
      const field = 'firstName';
      const direction = 'ASC';

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        sort: { field, direction },
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      const orderedInput = [
        registrationOCW1,
        registrationOCW2,
        registrationOCW3,
        registrationOCW4,
      ].sort((a, b) => (a[field] > b[field] ? 1 : -1)); // ASC

      expect(data[0][field]).toBe(orderedInput[0][field]);
      expect(data[1][field]).toBe(orderedInput[1][field]);
      expect(data[2][field]).toBe(orderedInput[2][field]);
      expect(data[3][field]).toBe(orderedInput[3][field]);
      expect(meta.totalItems).toBe(4);
    });

    it('should order attributes without value correctly', async () => {
      // Arrange
      // An attribute that is added to the program *after* registrations already
      // exist will not have a registration_data row for those existing
      const newAttributeName = 'batchId';
      const newAttribute: CreateProgramRegistrationAttributeDto = {
        name: newAttributeName,
        options: [],
        scoring: {},
        showInPeopleAffectedTable: true,
        editableInPortal: true,
        includeInTransactionExport: true,
        label: {
          en: 'Batch ID',
        },
        duplicateCheck: false,
        type: RegistrationAttributeTypes.numeric,
        isRequired: false,
      };
      await postProgramRegistrationAttribute(
        newAttribute,
        programIdOCW,
        accessToken,
      );

      // Give only some registrations a value, leaving the others without a
      // registration_data row for the attribute.
      await updateRegistration(
        programIdOCW,
        registrationOCW1.referenceId,
        { [newAttributeName]: 1 },
        'Set batch id for sorting test',
        accessToken,
      );
      await updateRegistration(
        programIdOCW,
        registrationOCW3.referenceId,
        { [newAttributeName]: 2 },
        'Set batch id for sorting test',
        accessToken,
      );

      // Act
      const getRegistrationsResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        sort: { field: newAttributeName, direction: 'ASC' },
      });
      const data = getRegistrationsResponse.body.data;
      const meta = getRegistrationsResponse.body.meta;

      // Assert
      expect(meta.totalItems).toBe(4);
      expect(data).toHaveLength(4);

      // Registrations with a value come first in ascending order, the ones
      // without a value are ordered last (and must not be dropped).
      expect(data[0].referenceId).toBe(registrationOCW1.referenceId);
      expect(data[1].referenceId).toBe(registrationOCW3.referenceId);
      const referenceIdsWithoutValue = [
        data[2].referenceId,
        data[3].referenceId,
      ];
      expect(referenceIdsWithoutValue).toEqual(
        expect.arrayContaining([
          registrationOCW2.referenceId,
          registrationOCW4.referenceId,
        ]),
      );
    });

    it('should sort numeric attributes numerically, not lexicographically', async () => {
      // Arrange
      const numericAttributeName = 'score';
      const numericAttribute: CreateProgramRegistrationAttributeDto = {
        name: numericAttributeName,
        options: [],
        scoring: {},
        showInPeopleAffectedTable: true,
        editableInPortal: true,
        includeInTransactionExport: true,
        label: {
          en: 'Score',
        },
        duplicateCheck: false,
        type: RegistrationAttributeTypes.numeric,
        isRequired: false,
      };

      await postProgramRegistrationAttribute(
        numericAttribute,
        programIdOCW,
        accessToken,
      );

      const referenceIdToValue = [
        { referenceId: registrationOCW1.referenceId, value: 100 },
        { referenceId: registrationOCW2.referenceId, value: 5 },
        { referenceId: registrationOCW3.referenceId, value: 20 },
        { referenceId: registrationOCW4.referenceId, value: 10 },
      ];
  
      for (const { referenceId, value } of referenceIdToValue) {
        await updateRegistration(
          programIdOCW,
          referenceId,
          { [numericAttributeName]: value },
          'Set score for numeric sorting test',
          accessToken,
        );
      }

      // Act
      const ascendingResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        sort: { field: numericAttributeName, direction: 'ASC' },
      });
      const descendingResponse = await getRegistrations({
        programId: programIdOCW,
        accessToken,
        sort: { field: numericAttributeName, direction: 'DESC' },
      });

      // Assert
      const ascendingValues = ascendingResponse.body.data.map((registration) =>
        Number(registration[numericAttributeName]),
      );
      const descendingValues = descendingResponse.body.data.map(
        (registration) => Number(registration[numericAttributeName]),
      );

      expect(ascendingValues).toEqual([5, 10, 20, 100]);
      expect(descendingValues).toEqual([100, 20, 10, 5]);
    });
  });
});
