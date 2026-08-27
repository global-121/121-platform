import { HttpStatus } from '@nestjs/common';

import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationScopedKisumuEastPv } from '@121-service/test/fixtures/scoped-registrations';
import {
  getRegistrations,
  importRegistrations,
  waitForRegistrationCount,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

const numberOfConcurrentBatches = 3;
const registrationsPerBatch = 2;
const numberOfConcurrentRegistrations =
  numberOfConcurrentBatches * registrationsPerBatch;
const numberOfOutOfScopeRegistrations = 4;
const numberOfInScopeRegistrations = 2;

const createRegistrations = ({
  scope,
  referenceIdPrefix,
  count,
}: {
  scope: DebugScope;
  referenceIdPrefix: string;
  count: number;
}) =>
  Array.from({ length: count }, (_, index) => ({
    ...registrationScopedKisumuEastPv,
    referenceId: `${referenceIdPrefix}-${index}`,
    scope,
  }));

const createSequenceUpTo = (count: number) =>
  Array.from({ length: count }, (_, index) => index + 1);

describe('Assign registrationProgramId', () => {
  let accessToken: string;

  beforeEach(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
  });

  it('should assign a unique sequential registrationProgramId to concurrently imported registrations', async () => {
    // Arrange
    const registrationBatches = Array.from(
      { length: numberOfConcurrentBatches },
      (_, batchIndex) =>
        createRegistrations({
          scope: DebugScope.KisumuEast,
          referenceIdPrefix: `concurrent-import-${batchIndex}`,
          count: registrationsPerBatch,
        }),
    );

    // Act
    await Promise.all(
      registrationBatches.map((registrations) =>
        importRegistrations(programIdPV, registrations, accessToken),
      ),
    );

    // Assert
    const registrations = await waitForRegistrationCount({
      programId: programIdPV,
      expectedCount: numberOfConcurrentRegistrations,
      accessToken,
      sort: { field: 'registrationProgramId', direction: 'ASC' },
    });

    expect(
      registrations.map((registration) => registration.registrationProgramId),
    ).toEqual(createSequenceUpTo(numberOfConcurrentRegistrations));
  });

  it('should continue the registrationProgramId sequence of registrations outside the scope of the importing user', async () => {
    // Arrange
    await importRegistrations(
      programIdPV,
      createRegistrations({
        scope: DebugScope.TurkanaNorth,
        referenceIdPrefix: 'out-of-scope-import',
        count: numberOfOutOfScopeRegistrations,
      }),
      accessToken,
    );
    const scopedAccessToken = await getAccessTokenScoped(DebugScope.Kisumu);

    // Act
    const importResponse = await importRegistrations(
      programIdPV,
      createRegistrations({
        scope: DebugScope.KisumuEast,
        referenceIdPrefix: 'in-scope-import',
        count: numberOfInScopeRegistrations,
      }),
      scopedAccessToken,
    );

    // Assert
    expect(importResponse.statusCode).toBe(HttpStatus.CREATED);

    const scopedRegistrationsResponse = await getRegistrations({
      programId: programIdPV,
      accessToken: scopedAccessToken,
    });
    expect(scopedRegistrationsResponse.body.data).toHaveLength(
      numberOfInScopeRegistrations,
    );

    const registrations = await waitForRegistrationCount({
      programId: programIdPV,
      expectedCount:
        numberOfOutOfScopeRegistrations + numberOfInScopeRegistrations,
      accessToken,
      sort: { field: 'registrationProgramId', direction: 'ASC' },
    });
    expect(
      registrations.map((registration) => registration.registrationProgramId),
    ).toEqual(
      createSequenceUpTo(
        numberOfOutOfScopeRegistrations + numberOfInScopeRegistrations,
      ),
    );
  });
});
