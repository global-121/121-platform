import { HttpStatus } from '@nestjs/common';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { ProgramPhase } from '../../src/shared/enum/program-phase.enum';
import {
  registrationNotScopedLvv,
  registrationNotScopedPv,
  registrationScopedGoesLvv,
  registrationScopedGoesPv,
  registrationScopedMiddelburgLvv,
  registrationScopedMiddelburgPv,
  registrationScopedUtrechtLvv,
  registrationScopedUtrechtPv,
} from '../fixtures/scoped-registrations';
import {
  changePhase,
  doPayment,
  getTransactions,
  waitForPaymentTransactionsToComplete,
} from '../helpers/program.helper';
import {
  awaitChangePaStatus,
  importRegistrations,
} from '../helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '../helpers/utility.helper';
import {
  programIdLVV,
  programIdPV,
} from '../registrations/pagination/pagination-data';

describe('Registrations - [Scoped]', () => {
  const LvvProgramId = programIdLVV;
  const PvProgramId = programIdPV;
  let accessToken: string;
  const registrationsLVV = [
    registrationScopedMiddelburgLvv,
    registrationScopedGoesLvv,
    registrationScopedUtrechtLvv,
    registrationNotScopedLvv,
  ];
  const registrationsPV = [
    registrationScopedMiddelburgPv,
    registrationScopedGoesPv,
    registrationScopedUtrechtPv,
    registrationNotScopedPv,
  ];
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

    await changePhase(
      LvvProgramId,
      ProgramPhase.registrationValidation,
      accessToken,
    );

    await importRegistrations(LvvProgramId, registrationsLVV, accessToken);

    await importRegistrations(PvProgramId, registrationsPV, accessToken);

    await changePhase(PvProgramId, ProgramPhase.inclusion, accessToken);
    await changePhase(PvProgramId, ProgramPhase.payment, accessToken);
    await changePhase(LvvProgramId, ProgramPhase.inclusion, accessToken);
    await changePhase(LvvProgramId, ProgramPhase.payment, accessToken);

    await awaitChangePaStatus(
      programIdLVV,
      registrationsLVV.map((r) => r.referenceId),
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
      8000,
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
    // Also check if the right referenceIds are in the transactions
    expect(referenceIdsTransactions.sort()).toEqual(
      registrationsPvFirst2ReferenceIds.sort(),
    );
  });
});
