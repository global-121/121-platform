import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { ProgramPhase } from '@121-service/src/shared/enum/program-phase.enum';
import {
  registrationScopedGoesPv,
  registrationScopedMiddelburgPv,
  registrationsPV,
} from '@121-service/test/fixtures/scoped-registrations';
import { changePhase } from '@121-service/test/helpers/program.helper';
import { importRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';
import { HttpStatus } from '@nestjs/common';

describe('Registrations - [Scoped]', () => {
  const OcwProgramId = programIdOCW;
  const PvProgramId = programIdPV;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await changePhase(
      OcwProgramId,
      ProgramPhase.registrationValidation,
      accessToken,
    );

    await importRegistrations(OcwProgramId, registrationsOCW, accessToken);
    await importRegistrations(PvProgramId, registrationsPV, accessToken);
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

    const expectedReferenceIds = [
      registrationScopedGoesPv.referenceId,
      registrationScopedMiddelburgPv.referenceId,
    ];

    // Also check if the right referenceIds are in the transactions
    expect(data.map((r) => r.referenceId).sort()).toEqual(
      expectedReferenceIds.sort(),
    );
  });

  it('should return all filtered registrations from 1 program within the scope of the requesting user', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    accessToken = await getAccessTokenScoped(testScope);

    // Act
    // 8 registrations in total are registered
    // 4 registrations are in include in program PV
    // 2 registrations are in include in program PV and are in the scope (Zeeland) of the requesting user
    // 1 of those 2 registrations has a fullName that has an 'o'
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${PvProgramId}/registrations`)
      .set('Cookie', [accessToken])
      .query({
        ['filter.fullName']: `$ilike:o`,
      })
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(1);

    const expectedReferenceIds = [registrationScopedGoesPv.referenceId];

    // Also check if the right referenceIds are in the transactions
    expect(data.map((r) => r.referenceId).sort()).toEqual(
      expectedReferenceIds.sort(),
    );
  });
});
