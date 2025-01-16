import { MigrationInterface, QueryRunner } from 'typeorm';

export class Nedbank1736155425026 implements MigrationInterface {
  name = 'Nedbank1736155425026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."nedbank_voucher" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "orderCreateReference" character varying NOT NULL, "status" character varying NOT NULL, "transactionId" integer NOT NULL, CONSTRAINT "UQ_3a31e9cd76bd9c06826c016c130" UNIQUE ("orderCreateReference"), CONSTRAINT "REL_739b726eaa8f29ede851906edd" UNIQUE ("transactionId"), CONSTRAINT "PK_85d56d9ed997ba24b53b3aa36e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0db7adee73f8cc5c9d44a77e7b" ON "121-service"."nedbank_voucher" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" ADD CONSTRAINT "FK_739b726eaa8f29ede851906edd3" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."nedbank_voucher" DROP CONSTRAINT "FK_739b726eaa8f29ede851906edd3"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0db7adee73f8cc5c9d44a77e7b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."nedbank_voucher"`);
  }
}
