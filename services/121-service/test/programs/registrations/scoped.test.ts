import { HttpStatus } from '@nestjs/common';
import { DebugScope } from '../../../src/scripts/enum/debug-scope.enum';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../../src/shared/enum/program-phase.model';
import {
  registrationNotScopedLvv,
  registrationNotScopedPv,
  registrationScopedGoesLvv,
  registrationScopedGoesPv,
  registrationScopedMiddelburgLvv,
  registrationScopedMiddelburgPv,
  registrationScopedUtrechtLvv,
  registrationScopedUtrechtPv,
} from '../../fixtures/scoped-registrations';
import { changePhase } from '../../helpers/program.helper';
import { importRegistrations } from '../../helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  getServer,
  resetDB,
} from '../../helpers/utility.helper';
import {
  programIdLVV,
  programIdPV,
} from '../../registrations/pagination/pagination-data';

describe('Registrations - [Scoped]', () => {
  const LvvProgramId = programIdLVV;
  const PvProgramId = programIdPV;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      LvvProgramId,
      ProgramPhase.registrationValidation,
      accessToken,
    );

    await importRegistrations(
      LvvProgramId,
      [
        registrationScopedMiddelburgLvv,
        registrationScopedGoesLvv,
        registrationScopedUtrechtLvv,
        registrationNotScopedLvv,
      ],
      accessToken,
    );
    await importRegistrations(
      PvProgramId,
      [
        registrationScopedMiddelburgPv,
        registrationScopedGoesPv,
        registrationScopedUtrechtPv,
        registrationNotScopedPv,
      ],
      accessToken,
    );
  });

  it('should return all registrations from 1 program within the scope of the requesting user', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    accessToken = await getAccessTokenScoped(testScope);

    // Act
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${PvProgramId}/registrations`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(2);
  });
});
