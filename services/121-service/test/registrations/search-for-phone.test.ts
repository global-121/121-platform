import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.model';
import { changePhase } from '../helpers/program.helper';
import {
  importRegistrations,
  searchRegistrationByPhoneNumber,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { registrationVisa } from '../../seed-data/mock/visa-card.data';

describe('Load PA table', () => {
  describe('using the "attributes" query-parameter', () => {
    let accessToken: string;
    const programId = 3;
    const registration1 = { ...registrationVisa };
    const registration2 = { ...registrationVisa };
    registration2.referenceId = '63e62864557597sade0d';
    registration2.phoneNumber = '14155238888';
    const registration3 = { ...registrationVisa };
    registration3.referenceId = '63e62864557597e0as';

    beforeEach(async () => {
      await resetDB(SeedScript.nlrcMultiple);
      accessToken = await getAccessToken();

      await changePhase(2, ProgramPhase.registrationValidation, accessToken);

      await changePhase(3, ProgramPhase.registrationValidation, accessToken);
      // Arrange
      await importRegistrations(
        programId,
        [registration1, registration2, registration3],
        accessToken,
      );
    });

    it('should only return 1 registration', async () => {
      // Act
      const searchResponse = await searchRegistrationByPhoneNumber(
        registration2.phoneNumber,
        accessToken,
      );

      // Assert
      expect(searchResponse.statusCode).toBe(HttpStatus.OK);
      expect(searchResponse.body.length).toBe(1);
    });

    it('should only return 2 registrations', async () => {
      // Act
      const searchResponse = await searchRegistrationByPhoneNumber(
        registration1.phoneNumber,
        accessToken,
      );

      // Assert
      expect(searchResponse.statusCode).toBe(HttpStatus.OK);
      expect(searchResponse.body.length).toBe(2);
    });

    it('should find 1 registration with phonenumber + notation', async () => {
      // Act
      const searchResponse = await searchRegistrationByPhoneNumber(
        `+${registration2.phoneNumber}`,
        accessToken,
      );

      // Assert
      expect(searchResponse.statusCode).toBe(HttpStatus.OK);
      expect(searchResponse.body.length).toBe(1);
    });

    it('should find registrations across program', async () => {
      //Arrange
      const registration4 = { ...registrationVisa };
      registration4.referenceId = '63e62864557597e0aasdas1123s';
      await importRegistrations(2, [registration4], accessToken);
      // Act
      const searchResponse = await searchRegistrationByPhoneNumber(
        `+${registration1.phoneNumber}`,
        accessToken,
      );

      // Assert
      expect(searchResponse.statusCode).toBe(HttpStatus.OK);
      expect(searchResponse.body.length).toBe(3);
    });
  });
});
