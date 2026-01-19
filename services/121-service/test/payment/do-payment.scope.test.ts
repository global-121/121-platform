import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { registrationsPV } from '@121-service/test/fixtures/scoped-registrations';
import {
  approvePayment,
  createPayment,
  getTransactionsByPaymentIdPaginated,
  startPayment,
  waitForPaymentAndTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangeRegistrationStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  createAccessTokenWithPermissions,
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

describe('Registrations - [Scoped]', () => {
  const OcwProgramId = programIdOCW;
  const PvProgramId = programIdPV;
  let accessTokenAdmin: string;

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
    accessTokenAdmin = await getAccessToken();

    await importRegistrations(OcwProgramId, registrationsOCW, accessTokenAdmin);

    await importRegistrations(PvProgramId, registrationsPV, accessTokenAdmin);

    await awaitChangeRegistrationStatus({
      programId: OcwProgramId,
      referenceIds: registrationsOCW.map((r) => r.referenceId),
      status: RegistrationStatusEnum.included,
      accessToken: accessTokenAdmin,
    });

    await awaitChangeRegistrationStatus({
      programId: programIdPV,
      referenceIds: registrationsPvFirst3ReferenceIds,
      status: RegistrationStatusEnum.included,
      accessToken: accessTokenAdmin,
    });
  });

  it('should payout all registrations within the scope of the starting user', async () => {
    // Arrange
    const testScope = DebugScope.Kisumu;
    const accessTokenScoped = await createAccessTokenWithPermissions({
      permissions: Object.values(PermissionEnum),
      programId: PvProgramId,
      scope: testScope,
      adminAccessToken: accessTokenAdmin,
    });

    // Act
    // 7 registrations in total are included
    // 3 registrations are included in program PV
    // 2 registrations are included in program PV and are in the scope of the requesting user
    const createPaymentResponse = await createPayment({
      programId: PvProgramId,
      transferValue: 25,
      referenceIds: [],
      accessToken: accessTokenScoped, // scoped user creates
      filter: { 'filter.status': '$in:included' },
    });
    const paymentId = createPaymentResponse.body.id;

    // admin approves, as scoped user cannot be approver
    await approvePayment({
      programId: PvProgramId,
      paymentId,
      accessToken: accessTokenAdmin,
    });

    // scoped user starts
    await startPayment({
      programId: PvProgramId,
      paymentId,
      accessToken: accessTokenScoped,
    });

    // Assert
    await waitForPaymentAndTransactionsToComplete({
      programId: PvProgramId,
      paymentReferenceIds: registrationsPvFirst2ReferenceIds,
      accessToken: accessTokenAdmin,
      maxWaitTimeMs: 20_000,
    });
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdPV,
      paymentId,
      registrationReferenceId: null,
      accessToken: accessTokenAdmin,
    });
    expect(createPaymentResponse.status).toBe(HttpStatus.CREATED);
    expect(createPaymentResponse.body.applicableCount).toBe(2);
    // Also check if the right amount of transactions are created
    const transactions = transactionsResponse.body.data;
    expect(transactions.length).toBe(2);
    const referenceIdsTransactions = transactions.map(
      (t) => t.registrationReferenceId,
    );

    // Also check if the right referenceIds are in the transactions
    expect(referenceIdsTransactions.sort()).toEqual(
      registrationsPvFirst2ReferenceIds.sort(),
    );
  });
});
