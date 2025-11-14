import { HttpStatus } from '@nestjs/common';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import {
  registrationScopedKisumuEastPv,
  registrationScopedKisumuWestPv,
  registrationsPV,
} from '@121-service/test/fixtures/scoped-registrations';
import {
  awaitChangeRegistrationStatus,
  deleteRegistrations,
  importRegistrations,
  waitForDeleteRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
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

describe('Metric export list', () => {
  let adminAccessToken: string;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);

    adminAccessToken = await getAccessToken();
    await importRegistrations(programIdOCW, registrationsOCW, adminAccessToken);
    await deleteRegistrations({
      programId: programIdOCW,
      referenceIds: [registrationsOCW[0].referenceId],
      accessToken: adminAccessToken,
    });
    await waitForDeleteRegistrations({
      programId: programIdOCW,
      referenceIds: [registrationsOCW[0].referenceId],
    });
    await awaitChangeRegistrationStatus({
      programId: programIdOCW,
      referenceIds: [registrationsOCW[1].referenceId],
      status: RegistrationStatusEnum.included,
      accessToken: adminAccessToken,
    });

    await importRegistrations(programIdPV, registrationsPV, adminAccessToken);
    await awaitChangeRegistrationStatus({
      programId: programIdPV,
      referenceIds: [registrationScopedKisumuWestPv.referenceId],
      status: RegistrationStatusEnum.included,
      accessToken: adminAccessToken,
    });
  });

  it('should export all registrations of a single program regardless of status', async () => {
    // Act
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${programIdOCW}/metrics/export-list/registrations`)
      .set('Cookie', [adminAccessToken])
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
  });

  it('should return all filtered registrations from 1 program using a filter for included and a scoped user', async () => {
    // Arrange
    const testScope = DebugScope.Kisumu;
    const testScopeAccessToken = await getAccessTokenScoped(testScope);

    // Act
    // 8 registrations in total are registered
    // 4 registrations are in include in program PV
    // 2 registrations of program PV and are in the scope (Zeeland) of the requesting user
    // 1 of those 2 registrations has status 'new'
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/export-list/registrations`)
      .set('Cookie', [testScopeAccessToken])
      .query({
        ['filter.status']: `$ilike:new`,
      })
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(1);

    const exportRegistration = data[0];
    expect(exportRegistration.referenceId).toBe(
      registrationScopedKisumuEastPv.referenceId,
    );
    expect(exportRegistration.status).toBe('new');
  });

  it('should return all filtered registrations from 1 program using a filter and search query', async () => {
    // Act
    // 8 registrations in total are registered
    // 4 registrations are in include in program PV
    // 2 registrations of program PV have an attribute that contains '011' (phonenumber)
    // 1 of those 2 registrations has status 'new'
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/export-list/registrations`)
      .set('Cookie', [adminAccessToken])
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
    expect(exportRegistration.referenceId).toBe(
      registrationScopedKisumuEastPv.referenceId,
    );
  });

  it('should export all registration attributes when no "select" is provided', async () => {
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${programIdOCW}/metrics/export-list/registrations`)
      .set('Cookie', [adminAccessToken])
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(5);

    for (const registration of registrationsOCW.slice(1)) {
      const exportRegistrationFound = data.find(
        (r) => r.referenceId === registration.referenceId,
      );
      expect(exportRegistrationFound).toMatchSnapshot({
        created: expect.any(String),
        // Status messages are sent async which makes testing over different environments irreliable
        lastMessageStatus: expect.any(String),
      });
    }
  });

  it('should support using "select" to retrieve a specific subset of columns', async () => {
    // Act
    const getRegistrationsResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/export-list/registrations`)
      .set('Cookie', [adminAccessToken])
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
    const testScope = DebugScope.Kisumu;
    const testScopeAccessToken = await getAccessTokenScoped(testScope);

    const getRegistrationsResponse = await getServer()
      .get(`/programs/${programIdPV}/metrics/export-list/registrations`)
      .set('Cookie', [testScopeAccessToken])
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
    const accessTokenNotEnoughPermissions =
      await createAccessTokenWithPermissions({
        permissions: [PermissionEnum.RegistrationPersonalEXPORT],
        programId: programIdPV,
        adminAccessToken,
      });

    const response = await getServer()
      .get(
        `/programs/${programIdPV}/metrics/export-list/${ExportType.unusedVouchers}`,
      )
      .set('Cookie', [accessTokenNotEnoughPermissions])
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

  it('should return 400 Bad Request for invalid exportType', async () => {
    const invalidExportType = 'notAValidType';
    const response = await getServer()
      .get(`/programs/${programIdPV}/metrics/export-list/${invalidExportType}`)
      .set('Cookie', [adminAccessToken])
      .send();

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toContain(invalidExportType);
  });
});
