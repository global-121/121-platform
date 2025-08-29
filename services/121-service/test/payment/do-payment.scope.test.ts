import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/user-role.enum';
import { registrationsPV } from '@121-service/test/fixtures/scoped-registrations';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/project.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  addPermissionToRole,
  getAccessToken,
  getAccessTokenScoped,
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

  const registrationsPvFirst3 = registrationsPV.slice(0, 3);
  const registrationsPvFirst3ReferenceIds = registrationsPvFirst3.map(
    (r) => r.referenceId,
  );
  const registrationsPvFirst2 = registrationsPV.slice(0, 2);
  const registrationsPvFirst2ReferenceIds = registrationsPvFirst2.map(
    (r) => r.referenceId,
  );

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await importRegistrations(OcwProjectId, registrationsOCW, accessToken);

    await importRegistrations(PvProjectId, registrationsPV, accessToken);

    await awaitChangeRegistrationStatus({
      projectId: OcwProjectId,
      referenceIds: registrationsOCW.map((r) => r.referenceId),
      status: RegistrationStatusEnum.included,
      accessToken,
    });

    await awaitChangeRegistrationStatus({
      projectId: projectIdPV,
      referenceIds: registrationsPvFirst3ReferenceIds,
      status: RegistrationStatusEnum.included,
      accessToken,
    });
  });

  it('should payout all registrations within the scope of the requesting user', async () => {
    // Arrange
    // add payment.create permission to the user
    await addPermissionToRole(DefaultUserRole.CvaManager, [
      PermissionEnum.PaymentCREATE,
    ]);

    const testScope = DebugScope.Kisumu;
    const accessTokenScoped = await getAccessTokenScoped(testScope);

    // Act
    // 7 registrations in total are included
    // 3 registrations are in include in project PV
    // 2 registrations are in include in project PV and are in the scope of the requesting user
    const doPaymentResponse = await doPayment({
      projectId: PvProjectId,
      amount: 25,
      referenceIds: [],
      accessToken: accessTokenScoped,
      filter: { 'filter.status': '$in:included' },
    });
    const paymentId = doPaymentResponse.body.id;

    // Assert
    await waitForPaymentTransactionsToComplete({
      projectId: PvProjectId,
      paymentReferenceIds: registrationsPvFirst2ReferenceIds,
      accessToken,
      maxWaitTimeMs: 10_000,
    });
    const transactionsResponse = await getTransactions({
      projectId: projectIdPV,
      paymentId,
      registrationReferenceId: null,
      accessToken,
    });
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(2);
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(2);
    const referenceIdsTransactions = transactionsResponse.body.map(
      (t) => t.registrationReferenceId,
    );

    // Also check if the right referenceIds are in the transactions
    expect(referenceIdsTransactions.sort()).toEqual(
      registrationsPvFirst2ReferenceIds.sort(),
    );
  });
});
