import { FilterOperator } from 'nestjs-paginate';

import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  registrationScopedKisumuEastPv,
  registrationScopedKisumuWestPv,
  registrationsPV,
} from '@121-service/test/fixtures/scoped-registrations';
import { getTransactionsByPaymentIdPaginated } from '@121-service/test/helpers/program.helper';
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

  let paymentIdPv: number;

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    await seedPaidRegistrations({
      registrations: registrationsOCW,
      programId: OcwProgramId,
    });
    paymentIdPv = await seedPaidRegistrations({
      registrations: registrationsPV,
      programId: PvProgramId,
    });
  });

  it('should return transactions with all expected fields and correct data types', async () => {
    // Arrange
    const accessToken = await getAccessToken();
    const fspConfig =
      FSP_SETTINGS[registrationScopedKisumuWestPv.programFspConfigurationName];

    // Act
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdPV,
      paymentId: paymentIdPv,
      accessToken,
    });
    const transactions = transactionsResponse.body.data;
    // Assert
    expect(transactions.length).toBe(registrationsPV.length);

    const transaction1 = transactions.find(
      (t) =>
        t.registrationReferenceId ===
        registrationScopedKisumuWestPv.referenceId,
    );

    // Check that all expected fields exist with correct types
    expect(transaction1).toMatchObject({
      created: expect.any(String),
      updated: expect.any(String),
      paymentId: paymentIdPv,
      registrationProgramId: expect.any(Number),
      registrationReferenceId: registrationScopedKisumuWestPv.referenceId,
      status: TransactionStatusEnum.success,
      transferValue: expect.any(Number),
      errorMessage: null,
      programFspConfigurationName: fspConfig.name,
    });

    // Validate date formats
    expect(new Date(transaction1.created).toISOString()).toBeTruthy();
    expect(new Date(transaction1.updated).toISOString()).toBeTruthy();
  });

  it('should get all transactions within the scope of the requesting user', async () => {
    // Arrange
    const testScope = DebugScope.Kisumu;
    const accessTokenScoped = await getAccessTokenScoped(testScope);

    // Act
    // 8 registrations in total are included
    // 4 registrations are in include in program PV
    // 2 registrations are in include in program PV and are in the scope (Zeeland) of the requesting user
    const transactionsResponse = await getTransactionsByPaymentIdPaginated({
      programId: programIdPV,
      paymentId: paymentIdPv,
      registrationReferenceId: null,
      accessToken: accessTokenScoped,
    });
    const transactions = transactionsResponse.body.data;

    // Assert
    // Check if the right amount of transactions are created
    expect(transactions.length).toBe(2);

    // Also check if the right referenceIds are in the transactions
    const referenceIdsTransactions = transactions.map(
      (t) => t.registrationReferenceId,
    );
    const registrationsZeelandReferenceIds = [
      registrationScopedKisumuEastPv.referenceId,
      registrationScopedKisumuWestPv.referenceId,
    ];
    expect(referenceIdsTransactions.sort()).toEqual(
      registrationsZeelandReferenceIds.sort(),
    );
  });

  describe('Transaction API Pagination and Filtering', () => {
    it('should sort transactions by created date in descending order', async () => {
      // Arrange
      const accessToken = await getAccessToken();

      // Act
      const transactionsResponse = await getTransactionsByPaymentIdPaginated({
        programId: programIdPV,
        paymentId: paymentIdPv,
        accessToken,
        sort: { field: 'created', direction: 'DESC' },
      });
      const transactions = transactionsResponse.body.data;

      // Assert - Check that transactions are sorted by created date
      const createdDates = transactions.map((t) => new Date(t.created));
      const sortedDates = [...createdDates].sort(
        (a, b) => b.getTime() - a.getTime(),
      );
      expect(createdDates).toEqual(sortedDates);
    });

    it('should filter transactions using $eq operator on registrationReferenceId', async () => {
      // Arrange
      const accessToken = await getAccessToken();

      // Act
      const transactionsResponse = await getTransactionsByPaymentIdPaginated({
        programId: programIdPV,
        paymentId: paymentIdPv,
        accessToken,
        filter: {
          'filter.registrationReferenceId': `${FilterOperator.EQ}:${registrationScopedKisumuWestPv.referenceId}`,
        },
      });
      const transactions = transactionsResponse.body.data;
      const meta = transactionsResponse.body.meta;

      expect(meta.totalItems).toBe(1);
      expect(transactions[0].registrationReferenceId).toBe(
        registrationScopedKisumuWestPv.referenceId,
      );
    });

    it('should filter transactions using $in operator on registrationReferenceId', async () => {
      // Arrange
      const accessToken = await getAccessToken();
      const targetReferenceIds = [
        registrationScopedKisumuEastPv.referenceId,
        registrationScopedKisumuWestPv.referenceId,
      ];

      // Act
      const transactionsResponse = await getTransactionsByPaymentIdPaginated({
        programId: programIdPV,
        paymentId: paymentIdPv,
        accessToken,
        filter: {
          'filter.registrationReferenceId': `${FilterOperator.IN}:${targetReferenceIds.join(',')}`,
        },
      });
      const transactions = transactionsResponse.body.data;
      const meta = transactionsResponse.body.meta;

      // Assert - Check that returned transactions match the filtered reference IDs
      expect(meta.totalItems).toBe(2);
      const returnedReferenceIds = transactions.map(
        (t) => t.registrationReferenceId,
      );
      expect(returnedReferenceIds.sort()).toEqual(targetReferenceIds.sort());
    });

    it('should return correct pagination metadata for limit 1 and page 2', async () => {
      // Arrange
      const accessToken = await getAccessToken();

      // Act
      const transactionsResponse = await getTransactionsByPaymentIdPaginated({
        programId: programIdPV,
        paymentId: paymentIdPv,
        accessToken,
        limit: 1,
        page: 2,
      });
      const transactions = transactionsResponse.body.data;
      const meta = transactionsResponse.body.meta;

      // Assert - Validate meta pagination data
      expect(meta.itemsPerPage).toBe(1);
      expect(meta.currentPage).toBe(2);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].paymentId).toBe(paymentIdPv);
    });
  });
});
