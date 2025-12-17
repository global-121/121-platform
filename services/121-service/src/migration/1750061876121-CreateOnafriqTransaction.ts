import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOnafriqTransaction1750061876121 implements MigrationInterface {
  name = 'CreateOnafriqTransaction1750061876121';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."onafriq_transaction" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "thirdPartyTransId" character varying NOT NULL, "transactionId" integer NOT NULL, CONSTRAINT "UQ_ad26abef457d617ce1a53108b0d" UNIQUE ("thirdPartyTransId"), CONSTRAINT "REL_1ef2718a1b73906b2af259cfa3" UNIQUE ("transactionId"), CONSTRAINT "PK_634787990e343084f1105420e9c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04b44b9abd570538d2b4958ee4" ON "121-service"."onafriq_transaction" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" ADD CONSTRAINT "FK_1ef2718a1b73906b2af259cfa30" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."onafriq_transaction" DROP CONSTRAINT "FK_1ef2718a1b73906b2af259cfa30"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_04b44b9abd570538d2b4958ee4"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."onafriq_transaction"`);
  }
}
