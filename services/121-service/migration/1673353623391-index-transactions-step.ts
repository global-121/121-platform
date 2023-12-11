import { MigrationInterface, QueryRunner } from 'typeorm';

export class indexTransactionsStep1673353623391 implements MigrationInterface {
  name = 'indexTransactionsStep1673353623391';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_edc9246b11c7368ca48fce10f4" ON "121-service"."transaction" ("transactionStep") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_edc9246b11c7368ca48fce10f4"`,
    );
  }
}
