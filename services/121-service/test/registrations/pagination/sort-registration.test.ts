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
          // Unordered on purpose, to test sorting/ordering later
          registrationOCW1, // Sequence number: 1
          registrationOCW3, // Sequence number: 2
          registrationOCW4, // Sequence number: 3
          registrationOCW2, // Sequence number: 4
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

    it('should sort based on registration root data', async () => {
      // Arrange
      const field = 'paymentAmountMultiplier';
      const direction = 'DESC';

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        null,
        { field, direction },
      );
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
      const getRegistrationsResponse = await getRegistrations(
        programIdOCW,
        null,
        accessToken,
        null,
        null,
        null,
        { field, direction },
      );
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
  });
});
