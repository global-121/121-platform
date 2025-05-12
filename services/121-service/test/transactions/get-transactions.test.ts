import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  registrationScopedGoesPv,
  registrationScopedMiddelburgPv,
  registrationsPV,
} from '@121-service/test/fixtures/scoped-registrations';
import { getTransactions } from '@121-service/test/helpers/program.helper';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
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

describe('Registrations - [Scoped]', () => {
  const OcwProgramId = programIdOCW;
  const PvProgramId = programIdPV;

  const payment = 1;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    await seedPaidRegistrations(registrationsOCW, OcwProgramId);
    await seedPaidRegistrations(registrationsPV, PvProgramId);
  });

  it('should return transactions with all expected fields and correct data types', async () => {
    // Arrange
    const accessToken = await getAccessToken();
    const fspConfig = getFinancialServiceProviderSettingByNameOrThrow(
      registrationScopedMiddelburgPv.programFinancialServiceProviderConfigurationName,
    );

    // Act
    const transactionsResponse = await getTransactions({
      programId: programIdPV,
      paymentNr: payment,
      referenceId: null,
      accessToken,
    });

    // Assert
    expect(transactionsResponse.body.length).toBe(registrationsPV.length);

    const transaction1 = transactionsResponse.body.find(
      (t) => t.referenceId === registrationScopedMiddelburgPv.referenceId,
    );

    // Check that all expected fields exist with correct types
    expect(transaction1).toMatchObject({
      created: expect.any(String),
      updated: expect.any(String),
      payment,
      registrationProgramId: expect.any(Number),
      referenceId: registrationScopedMiddelburgPv.referenceId,
      status: TransactionStatusEnum.success,
      amount: expect.any(Number),
      errorMessage: null,
      registrationName: registrationScopedMiddelburgPv.fullName,
      programFinancialServiceProviderConfigurationName: fspConfig.name,
    });

    // Validate date formats
    expect(new Date(transaction1.created).toISOString()).toBeTruthy();
    expect(new Date(transaction1.updated).toISOString()).toBeTruthy();
  });

  it('should get all transactions within the scope of the requesting user', async () => {
    // Arrange
    const testScope = DebugScope.Zeeland;
    const accessTokenScoped = await getAccessTokenScoped(testScope);

    // Act
    // 8 registrations in total are included
    // 4 registrations are in include in program PV
    // 2 registrations are in include in program PV and are in the scope (Zeeland) of the requesting user
    const transactionsResponse = await getTransactions({
      programId: programIdPV,
      paymentNr: payment,
      referenceId: null,
      accessToken: accessTokenScoped,
    });

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
