import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase } from '../helpers/program.helper';
import {
  getRegistrations,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Load PA table', () => {
  const programId = 3;
  const referenceId = '63e62864557597e0d';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '14155238886',
    fspName: FspName.intersolveJumboPhysical,
    whatsappPhoneNumber: '14155238886',
    addressStreet: 'Teststraat',
    addressHouseNumber: '1',
    addressHouseNumberAddition: '',
    addressPostalCode: '1234AB',
    addressCity: 'Stad',
  };

  const attribute1 = 'whatsappPhoneNumber';
  const attribute2 = 'addressCity';

  describe('using the "attributes" query-parameter', () => {
    let accessToken: string;

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await changePhase(
        programId,
        ProgramPhase.registrationValidation,
        accessToken,
      );

      await importRegistrations(programId, [registration], accessToken);
    });

    it('should only return requested dynamic attributes if param-values supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = [attribute1];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
      );

      // Assert
      expect(getRegistrationsResponse.body[0]).toHaveProperty(attribute1);
      expect(getRegistrationsResponse.body[0]).not.toHaveProperty(attribute2);
    });

    it('should return no dynamic attributes if param supplied but with empty value', async () => {
      // Arrange
      const requestedDynamicAttributes = [];

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
      );

      // Assert
      expect(getRegistrationsResponse.body[0]).not.toHaveProperty(attribute1);
      expect(getRegistrationsResponse.body[0]).not.toHaveProperty(attribute2);
    });

    it('should return all dynamic attributes if param not supplied', async () => {
      // Arrange
      const requestedDynamicAttributes = null;

      // Act
      const getRegistrationsResponse = await getRegistrations(
        programId,
        requestedDynamicAttributes,
        accessToken,
      );

      // Assert
      expect(getRegistrationsResponse.body[0]).toHaveProperty(attribute1);
      expect(getRegistrationsResponse.body[0]).toHaveProperty(attribute2);
    });
  });
});
