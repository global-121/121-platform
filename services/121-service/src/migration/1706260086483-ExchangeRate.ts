import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExchangeRate1706260086483 implements MigrationInterface {
  name = 'ExchangeRate1706260086483';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."exchange_rate" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "currency" character varying NOT NULL, "euroExchangeRate" real NOT NULL, "closeTime" character varying, CONSTRAINT "PK_d4c075e294b3b2c46d09b75b972" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09f4da9c51fed8a8db4ea7050b" ON "121-service"."exchange_rate" ("created") `,
    );

    // Solve 1 remaining occurence of table with dashes instead of underscores.
    await queryRunner.query(
      `ALTER TABLE "121-service"."commercial-bank-ethiopia-account-enquiries" rename to "commercial_bank_ethiopia_account_enquiries"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_09f4da9c51fed8a8db4ea7050b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."exchange_rate"`);
  }
}
