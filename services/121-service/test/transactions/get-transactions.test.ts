import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  registrationScopedGoesPv,
  registrationScopedMiddelburgPv,
  registrationsPV,
} from '../fixtures/scoped-registrations';
import { getTransactions } from '../helpers/program.helper';
import { seedPaidRegistrations } from '../helpers/registration.helper';
import { getAccessTokenScoped, resetDB } from '../helpers/utility.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
} from '../registrations/pagination/pagination-data';

describe('Registrations - [Scoped]', () => {
  const OcwProgramId = programIdOCW;
  const PvProgramId = programIdPV;

  const payment = 1;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    await seedPaidRegistrations(registrationsOCW, OcwProgramId);
    await seedPaidRegistrations(registrationsPV, PvProgramId);
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

    // Assert
    // Check if the right amount of transactions are created
    expect(transactionsResponse.body.length).toBe(2);

    // Also check if the right referenceIds are in the transactions
    const referenceIdsTransactions = transactionsResponse.body.map(
      (t) => t.referenceId,
    );
    const registrationsZeelandReferenceIds = [
      registrationScopedGoesPv.referenceId,
      registrationScopedMiddelburgPv.referenceId,
    ];
    expect(referenceIdsTransactions.sort()).toEqual(
      registrationsZeelandReferenceIds.sort(),
    );
  });
});
