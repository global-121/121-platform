import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { registrationsPV } from '@121-service/test/fixtures/scoped-registrations';
import {
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
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

  const registrationsPvFirst3 = registrationsPV.slice(0, 3);
  const registrationsPvFirst3ReferenceIds = registrationsPvFirst3.map(
    (r) => r.referenceId,
  );
  const registrationsPvFirst2 = registrationsPV.slice(0, 2);
  const registrationsPvFirst2ReferenceIds = registrationsPvFirst2.map(
    (r) => r.referenceId,
  );
  const payment = 1;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(OcwProgramId, registrationsOCW, accessToken);

    await importRegistrations(PvProgramId, registrationsPV, accessToken);

    await awaitChangePaStatus(
      OcwProgramId,
      registrationsOCW.map((r) => r.referenceId),
      RegistrationStatusEnum.included,
      accessToken,
    );

    await awaitChangePaStatus(
      programIdPV,
      registrationsPvFirst3ReferenceIds,
      RegistrationStatusEnum.included,
      accessToken,
    );
  });

  it('should payout all registrations within the scope of the requesting user', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    const accessTokenScoped = await getAccessTokenScoped(testScope);

    // Act
    // 7 registrations in total are included
    // 3 registrations are in include in program PV
    // 2 registrations are in include in program PV and are in the scope of the requesting user
    const doPaymentResponse = await doPayment(
      PvProgramId,
      payment,
      25,
      [],
      accessTokenScoped,
      { 'filter.status': '$in:included' },
    );

    // Assert
    await waitForPaymentTransactionsToComplete(
      PvProgramId,
      registrationsPvFirst2ReferenceIds,
      accessToken,
      10_000,
    );
    const transactionsResponse = await getTransactions(
      programIdPV,
      payment,
      null,
      accessToken,
    );
    expect(doPaymentResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(doPaymentResponse.body.applicableCount).toBe(2);
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(2);
    const referenceIdsTransactions = transactionsResponse.body.map(
      (t) => t.referenceId,
    );

    for (const transaction of transactionsResponse.body) {
      expect(transaction.user.username).toContain(testScope);
    }

    // Also check if the right referenceIds are in the transactions
    expect(referenceIdsTransactions.sort()).toEqual(
      registrationsPvFirst2ReferenceIds.sort(),
    );
  });
});
