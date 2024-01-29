import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExchangeRate1706260086483 implements MigrationInterface {
  name = 'ExchangeRate1706260086483';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."exchange-rate" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "currency" character varying NOT NULL, "euroExchangeRate" real NOT NULL, CONSTRAINT "PK_d4c075e294b3b2c46d09b75b972" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09f4da9c51fed8a8db4ea7050b" ON "121-service"."exchange-rate" ("created") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_09f4da9c51fed8a8db4ea7050b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."exchange-rate"`);
  }
}
