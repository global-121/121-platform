import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  registrationScopedGoesPv,
  registrationScopedMiddelburgPv,
  registrationsPV,
} from '@121-service/test/fixtures/scoped-registrations';
import {
  awaitChangeRegistrationStatus,
  deleteRegistrations,
  importRegistrations,
  waitForDeleteRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenCvaManager,
  getAccessTokenScoped,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

function createExportObject(
  registration: Partial<RegistrationEntity> | any,
): RegistrationEntity | any {
  const exportObject = {
    ...registration,
  };
  delete exportObject.programFspConfigurationName;
  // remove empty values
  Object.keys(exportObject).forEach(
    (key) => !exportObject[key] && delete exportObject[key],
  );
  exportObject.paymentCount = 0;
  return exportObject;
}

describe('Metric export list', () => {
  const OcwProgramId = programIdOCW;
  const PvProgramId = programIdPV;
  let accessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);

    accessToken = await getAccessToken();
    await importRegistrations(OcwProgramId, registrationsOCW, accessToken);
    await deleteRegistrations({
      programId: OcwProgramId,
      referenceIds: [registrationsOCW[0].referenceId],
      accessToken,
    });
    await waitForDeleteRegistrations({
      programId: OcwProgramId,
      referenceIds: [registrationsOCW[0].referenceId],
    });
    await awaitChangeRegistrationStatus({
      programId: OcwProgramId,
      referenceIds: [registrationsOCW[1].referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    await importRegistrations(PvProgramId, registrationsPV, accessToken);
    await awaitChangeRegistrationStatus({
      programId: PvProgramId,
      referenceIds: [registrationScopedMiddelburgPv.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken,
    });
  });

  it('should export all people affected of a single program regardless of status', async () => {
    // Act
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${OcwProgramId}/metrics/export-list/all-registrations`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(5);

    const expectedReferenceIds = registrationsOCW.map((r) => r.referenceId);

    // Also check if the right referenceIds are in the eport
    expect(data.map((r) => r.referenceId).sort()).toEqual(
      expectedReferenceIds.sort(),
    );

    for (const registration of registrationsOCW.slice(1)) {
      const exportRegistrationFound = data.find(
        (r) => r.referenceId === registration.referenceId,
      );
      expect(exportRegistrationFound).toMatchObject(
        createExportObject(registration),
      );
    }
  });

  it('should return all filtered registrations from 1 program using a filter for included and a scoped user', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    accessToken = await getAccessTokenScoped(testScope);

    // Act
    // 8 registrations in total are registered
    // 4 registrations are in include in program PV
    // 2 registrations of program PV and are in the scope (Zeeland) of the requesting user
    // 1 of those 2 registrations has status 'new'
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${PvProgramId}/metrics/export-list/all-registrations`)
      .set('Cookie', [accessToken])
      .query({
        ['filter.status']: `$ilike:new`,
      })
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(1);

    const exportRegistration = data[0];

    expect(exportRegistration).toMatchObject(
      createExportObject(registrationScopedGoesPv),
    );
  });

  it('should return all filtered registrations from 1 program using a filter and search query', async () => {
    // Arrange
    accessToken = await getAccessToken(); // gets admin access token

    // Act
    // 8 registrations in total are registered
    // 4 registrations are in include in program PV
    // 2 registrations of program PV have an attribute that contains '011' (phonenumber)
    // 1 of those 2 registrations has status 'new'
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${PvProgramId}/metrics/export-list/all-registrations`)
      .set('Cookie', [accessToken])
      .query({
        ['filter.status']: `$ilike:new`,
        search: `011`,
      })
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(1);

    const exportRegistration = data[0];

    expect(exportRegistration).toMatchObject(
      createExportObject(registrationScopedGoesPv),
    );
  });

  it('should support using "select" to retrieve a specific subset of columns', async () => {
    // Arrange
    accessToken = await getAccessToken(); // gets admin access token

    // Act
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${PvProgramId}/metrics/export-list/all-registrations`)
      .set('Cookie', [accessToken])
      .query({
        select: 'referenceId,fullName,phoneNumber',
      })
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(4);

    expect(data).toMatchSnapshot();
  });

  it('should export in excel format', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    accessToken = await getAccessTokenScoped(testScope);

    const getRegistrationsResponse = await getServer()
      .get(`/programs/${PvProgramId}/metrics/export-list/all-registrations`)
      .set('Cookie', [accessToken])
      .responseType('blob')
      .query({
        format: 'xlsx',
      })
      .send();

    // Assert check if an excel is returned
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(getRegistrationsResponse.header['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(Buffer.isBuffer(getRegistrationsResponse.body)).toBe(true);
  });

  it("should export failed when user doesn't have enough permission", async () => {
    const accessTokenCvaManager = await getAccessTokenCvaManager();

    const response = await getServer()
      .get(`/programs/${PvProgramId}/metrics/export-list/payment`)
      .set('Cookie', [accessTokenCvaManager])
      .responseType('blob')
      .query({
        format: 'xlsx',
      })
      .send();

    // Assert check if error returned
    const jsonResponse = JSON.parse(response.body.toString());
    expect(jsonResponse.statusCode).toBe(HttpStatus.FORBIDDEN);
    expect(jsonResponse.message).toBe(
      "Forbidden! User doesn't have enough permission to export requested data.",
    );
  });
});
