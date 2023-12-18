import { HttpStatus } from '@nestjs/common';
import { DebugScope } from '../../../src/scripts/enum/debug-scope.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
import {
  registrationNotScoped,
  registrationScopedGoes,
  registrationScopedMiddelburg,
  registrationScopedUtrecht,
} from '../../fixtures/scoped-registrations';
import { changePhase } from '../../helpers/program.helper';
import { importRegistrations } from '../../helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  getServer,
  resetDB,
} from '../../helpers/utility.helper';
import { programIdOCW } from '../../registrations/pagination/pagination-data';

describe('Programs / Registrations - [Scoped]', () => {
  const testProgramId = programIdOCW;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      testProgramId,
      ProgramPhase.registrationValidation,
      accessToken,
    );

    await importRegistrations(
      testProgramId,
      [
        registrationScopedMiddelburg,
        registrationScopedGoes,
        registrationScopedUtrecht,
        registrationNotScoped,
      ],
      accessToken,
    );
  });

  it('should return all registrations within the scope of the requesting user', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    accessToken = await getAccessTokenScoped(testScope);

    // Act
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${testProgramId}/registrations`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(2);
  });
});
