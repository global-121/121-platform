import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ORMConfig } from '@121-service/src/ormconfig';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

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
  }): Promise<{
    fixedTransferValue: number;
    fixedTransferValueNumeric: string;
    budget: number;
    budgetNumeric: string;
  }> => {
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
  }): Promise<{ transferValue: number; transferValueNumeric: string }> => {
    const [[transaction]] = await dataSource.query(
      `UPDATE "121-service"."transaction" SET "${column}" = $1 WHERE id = $2
       RETURNING "transferValue", "transferValueNumeric"`,
      [value, transactionId],
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

  it('should mirror budgets in both directions', async () => {
    // Act
    const afterNumericWrite = await updateProgram({
      column: 'budgetNumeric',
      value: '5000',
    });
    const afterLegacyWrite = await updateProgram({
      column: 'budget',
      value: 7000,
    });

    // Assert
    expect(afterNumericWrite.budget).toBe(5000);
    expect(afterLegacyWrite.budgetNumeric).toBe('7000');
  });

  it('should reject a budget that does not fit the legacy integer column', async () => {
    // Act & Assert
    await expect(
      updateProgram({ column: 'budgetNumeric', value: '12.5' }),
    ).rejects.toThrow(/legacy integer range/);
    await expect(
      updateProgram({ column: 'budgetNumeric', value: '2147483648' }),
    ).rejects.toThrow(/legacy integer range/);
  });

  it('should mirror transaction transfer values in both directions', async () => {
    // Act
    const afterNumericWrite = await updateTransaction({
      column: 'transferValueNumeric',
      value: '123.456',
    });
    const afterLegacyWrite = await updateTransaction({
      column: 'transferValue',
      value: 234.56,
    });

    // Assert
    expect(afterNumericWrite.transferValue).toBeCloseTo(123.456, 3);
    expect(afterLegacyWrite.transferValueNumeric).toBe('234.56');
  });
});
