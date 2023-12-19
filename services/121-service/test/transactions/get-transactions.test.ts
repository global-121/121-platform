import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
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
import { getTransactions } from '../helpers/program.helper';
import { seedPayedRegistrations } from '../helpers/registration.helper';
import { getAccessTokenScoped, resetDB } from '../helpers/utility.helper';
import {
  programIdLVV,
  programIdPV,
} from '../registrations/pagination/pagination-data';

describe('Registrations - [Scoped]', () => {
  const LvvProgramId = programIdLVV;
  const PvProgramId = programIdPV;
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
  const payment = 1;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    await seedPayedRegistrations(registrationsLVV, LvvProgramId);
    await seedPayedRegistrations(registrationsPV, PvProgramId);
  });

  it('should get all transactions within the scope of the requesting user', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    const accessTokenScoped = await getAccessTokenScoped(testScope);

    // Act
    // 8 registrations in total are included
    // 4 registrations are in include in program PV
    // 2 registrations are in include in program PV and are in the scope (Zeeland) of the requesting user
    const transactionsResponse = await getTransactions(
      programIdPV,
      payment,
      null,
      accessTokenScoped,
    );
    // Also check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(2);
    const referenceIdsTransactions = transactionsResponse.body.map(
      (t) => t.referenceId,
    );

    const registrationsZeelandReferenceIds = [
      registrationScopedGoesPv.referenceId,
      registrationScopedMiddelburgPv.referenceId,
    ];
    // Also check if the right referenceIds are in the transactions
    expect(referenceIdsTransactions.sort()).toEqual(
      registrationsZeelandReferenceIds.sort(),
    );
  });
});
