import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ORMConfig } from '@121-service/src/ormconfig';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

interface ProgramCurrencyColumns {
  fixedTransferValue: number;
  fixedTransferValueNumeric: string;
  budget: number;
  budgetNumeric: string;
}

interface TransactionCurrencyColumns {
  transferValue: number;
  transferValueNumeric: string;
}

describe('Currency column synchronization during the compatibility period', () => {
  const programId = 1;
  const transferValue = 15;

  let moduleRef: TestingModule;
  let dataSource: DataSource;
  let transactionId: number;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.safaricomProgram });
    await seedPaidRegistrations({
      registrations: [registrationSafaricom],
      programId,
      transferValue,
      completeStatuses: [TransactionStatusEnum.success],
    });

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...ORMConfig,
          entities: ['src/**/*.entity.ts'],
          subscribers: [],
        }),
      ],
    }).compile();
    dataSource = moduleRef.get(DataSource);

    const [transaction] = await dataSource.query(
      `SELECT t.id FROM "121-service"."transaction" t
       JOIN "121-service"."payment" p ON p.id = t."paymentId"
       WHERE p."programId" = $1 LIMIT 1`,
      [programId],
    );
    transactionId = transaction.id;
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  const updateProgram = async ({
    column,
    value,
  }: {
    column: string;
    value: string | number;
  }): Promise<ProgramCurrencyColumns> => {
    const [[program]] = await dataSource.query(
      `UPDATE "121-service"."program" SET "${column}" = $1 WHERE id = $2
       RETURNING "fixedTransferValue", "fixedTransferValueNumeric", "budget", "budgetNumeric"`,
      [value, programId],
    );
    return program;
  };

  const updateTransaction = async ({
    column,
    value,
  }: {
    column: string;
    value: string | number;
  }): Promise<TransactionCurrencyColumns> => {
    const [[transaction]] = await dataSource.query(
      `UPDATE "121-service"."transaction" SET "${column}" = $1 WHERE id = $2
       RETURNING "transferValue", "transferValueNumeric"`,
      [value, transactionId],
    );
    return transaction;
  };

  const insertProgram = async ({
    fixedTransferValueColumn,
    fixedTransferValue,
    budgetColumn,
    budget,
  }: {
    fixedTransferValueColumn: string;
    fixedTransferValue: string | number;
    budgetColumn: string;
    budget: string | number;
  }): Promise<ProgramCurrencyColumns> => {
    const [program] = await dataSource.query(
      `INSERT INTO "121-service"."program" ("${fixedTransferValueColumn}", "${budgetColumn}") VALUES ($1, $2)
       RETURNING "fixedTransferValue", "fixedTransferValueNumeric", "budget", "budgetNumeric"`,
      [fixedTransferValue, budget],
    );
    return program;
  };

  // Each insert needs its own payment because (registrationId, paymentId) is unique
  const insertTransaction = async ({
    column,
    value,
  }: {
    column: string;
    value: string | number;
  }): Promise<TransactionCurrencyColumns> => {
    const [transaction] = await dataSource.query(
      `WITH "newPayment" AS (
         INSERT INTO "121-service"."payment" ("programId", "name") VALUES ($1, $2) RETURNING id
       )
       INSERT INTO "121-service"."transaction" ("paymentId", "registrationId", "userId", "status", "${column}")
       SELECT "newPayment".id, t."registrationId", t."userId", t.status, $3
       FROM "newPayment", "121-service"."transaction" t WHERE t.id = $4
       RETURNING "transferValue", "transferValueNumeric"`,
      [programId, `Currency synchronization ${column}`, value, transactionId],
    );
    return transaction;
  };

  it('should keep the numeric transfer value equal to the legacy value of seeded transactions', async () => {
    // Act
    const [transaction] = await dataSource.query(
      `SELECT "transferValue", "transferValueNumeric" FROM "121-service"."transaction" WHERE id = $1`,
      [transactionId],
    );

    // Assert
    expect(Number(transaction.transferValueNumeric)).toBe(
      transaction.transferValue,
    );
  });

  it('should mirror a numeric fixed transfer value to the legacy column', async () => {
    // Act
    const program = await updateProgram({
      column: 'fixedTransferValueNumeric',
      value: '123.456',
    });

    // Assert
    expect(program.fixedTransferValueNumeric).toBe('123.456');
    expect(program.fixedTransferValue).toBeCloseTo(123.456, 3);
  });

  it('should mirror a legacy fixed transfer value to the numeric column', async () => {
    // Act
    const program = await updateProgram({
      column: 'fixedTransferValue',
      value: 234.56,
    });

    // Assert
    expect(program.fixedTransferValueNumeric).toBe('234.56');
  });

  it('should mirror a numeric budget to the legacy column', async () => {
    // Act
    const program = await updateProgram({
      column: 'budgetNumeric',
      value: '5000',
    });

    // Assert
    expect(program.budget).toBe(5000);
  });

  it('should mirror a legacy budget to the numeric column', async () => {
    // Act
    const program = await updateProgram({
      column: 'budget',
      value: 7000,
    });

    // Assert
    expect(program.budgetNumeric).toBe('7000');
  });

  it.each(['12.5', '2147483648'])(
    'should reject budget %s because it does not fit the legacy integer column',
    async (budget) => {
      // Act & Assert
      await expect(
        updateProgram({ column: 'budgetNumeric', value: budget }),
      ).rejects.toThrow(/legacy integer range/);
    },
  );

  it('should mirror a numeric transaction transfer value to the legacy column', async () => {
    // Act
    const transaction = await updateTransaction({
      column: 'transferValueNumeric',
      value: '123.456',
    });

    // Assert
    expect(transaction.transferValue).toBeCloseTo(123.456, 3);
  });

  it('should mirror a legacy transaction transfer value to the numeric column', async () => {
    // Act
    const transaction = await updateTransaction({
      column: 'transferValue',
      value: 234.56,
    });

    // Assert
    expect(transaction.transferValueNumeric).toBe('234.56');
  });

  it('should mirror numeric values to the legacy columns when a program is inserted', async () => {
    // Act
    const program = await insertProgram({
      fixedTransferValueColumn: 'fixedTransferValueNumeric',
      fixedTransferValue: '123.456',
      budgetColumn: 'budgetNumeric',
      budget: '5000',
    });

    // Assert
    expect(program.fixedTransferValue).toBeCloseTo(123.456, 3);
    expect(program.budget).toBe(5000);
  });

  it('should fill the numeric columns from legacy values when a program is inserted', async () => {
    // Act
    const program = await insertProgram({
      fixedTransferValueColumn: 'fixedTransferValue',
      fixedTransferValue: 234.56,
      budgetColumn: 'budget',
      budget: 7000,
    });

    // Assert
    expect(program.fixedTransferValueNumeric).toBe('234.56');
    expect(program.budgetNumeric).toBe('7000');
  });

  it('should mirror a numeric transfer value to the legacy column when a transaction is inserted', async () => {
    // Act
    const transaction = await insertTransaction({
      column: 'transferValueNumeric',
      value: '123.456',
    });

    // Assert
    expect(transaction.transferValue).toBeCloseTo(123.456, 3);
  });

  it('should fill the numeric transfer value from the legacy value when a transaction is inserted', async () => {
    // Act
    const transaction = await insertTransaction({
      column: 'transferValue',
      value: 234.56,
    });

    // Assert
    expect(transaction.transferValueNumeric).toBe('234.56');
  });
});
