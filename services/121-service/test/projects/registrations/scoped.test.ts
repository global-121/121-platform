import { HttpStatus } from '@nestjs/common';

import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  registrationScopedKisumuEastPv,
  registrationScopedKisumuWestPv,
  registrationsPV,
} from '@121-service/test/fixtures/scoped-registrations';
import { getTransactions } from '@121-service/test/helpers/project.helper';
import {
  importRegistrations,
  seedPaidRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  getServer,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdOCW,
  projectIdPV,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Registrations - [Scoped]', () => {
  const OcwProjectId = projectIdOCW;
  const PvProjectId = projectIdPV;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
  });

  it('should return all registrations from 1 project within the scope of the requesting user', async () => {
    // Arrange
    await importRegistrations(OcwProjectId, registrationsOCW, accessToken);
    await importRegistrations(PvProjectId, registrationsPV, accessToken);
    const testScope = DebugScope.Kisumu;
    accessToken = await getAccessTokenScoped(testScope);

    // Act
    const getRegistrationsResponse = await getServer()
      .get(`/projects/${PvProjectId}/registrations`)
      .set('Cookie', [accessToken])
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(2);

    const expectedReferenceIds = [
      registrationScopedKisumuEastPv.referenceId,
      registrationScopedKisumuWestPv.referenceId,
    ];

    // Also check if the right referenceIds are in the transactions
    expect(data.map((r) => r.referenceId).sort()).toEqual(
      expectedReferenceIds.sort(),
    );
  });

  it('should return all filtered registrations from 1 project within the scope of the requesting user', async () => {
    // Arrange
    await importRegistrations(OcwProjectId, registrationsOCW, accessToken);
    await importRegistrations(PvProjectId, registrationsPV, accessToken);
    const testScope = DebugScope.Kisumu;
    accessToken = await getAccessTokenScoped(testScope);

    // Act
    // 8 registrations in total are registered
    // 4 registrations are in include in project PV
    // 2 registrations are in include in project PV and are in the scope (Zeeland) of the requesting user
    // 1 of those 2 registrations has a fullName that has an 'o'
    const getRegistrationsResponse = await getServer()
      .get(`/projects/${PvProjectId}/registrations`)
      .set('Cookie', [accessToken])
      .query({
        ['filter.fullName']: `$ilike:o`,
      })
      .send();

    // Assert
    const data = getRegistrationsResponse.body.data;
    expect(getRegistrationsResponse.status).toBe(HttpStatus.OK);
    expect(data.length).toBe(1);

    const expectedReferenceIds = [registrationScopedKisumuEastPv.referenceId];

    // Also check if the right referenceIds are in the transactions
    expect(data.map((r) => r.referenceId).sort()).toEqual(
      expectedReferenceIds.sort(),
    );
  });

  // This tests if the ScopedRepository of entities related to registrations is working correctly
  it('should get only transactions that from 1 project within the scope of the requesting user', async () => {
    // Arrange
    await seedPaidRegistrations(registrationsPV, PvProjectId);
    await seedPaidRegistrations(registrationsOCW, OcwProjectId);

    const testScope = DebugScope.Kisumu;
    accessToken = await getAccessTokenScoped(testScope);

    // Act
    const transactionResponse = await getTransactions({
      projectId: PvProjectId,
      paymentId: 1,
      registrationReferenceId: null,
      accessToken,
    });
    const transactions = transactionResponse.body;

    const refrenceIdsWithAllowedScope = registrationsPV
      .filter((r) => r.scope.startsWith(testScope))
      .map((r) => r.referenceId);

    const referenceIdsFromTransactions = transactions.map(
      (transaction) => transaction.registrationReferenceId,
    );

    // Sort both arrays
    const sortedAllowedReferenceIds = refrenceIdsWithAllowedScope.sort();
    const sortedReferenceIdsFromTransactions =
      referenceIdsFromTransactions.sort();

    // Validate that both arrays contain the same values
    expect(sortedAllowedReferenceIds).toEqual(
      sortedReferenceIdsFromTransactions,
    );
  });
});
