import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionEvent1758099928516 implements MigrationInterface {
  name = 'TransactionEvent1758099928516';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_605baeb040ff0fae995404cea37"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_edc9246b11c7368ca48fce10f4"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."transaction_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "errorMessage" character varying, "type" character varying NOT NULL, "transactionId" integer NOT NULL, CONSTRAINT "PK_1b4101c76f4a2c8168aeb8f3bad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b636b04e270121a24f08d1af9b" ON "121-service"."transaction_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_695faaebd651cc12b4b295880d" ON "121-service"."transaction_event" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4f1b2124aaac715c149460ef4" ON "121-service"."transaction_event" ("transactionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "errorMessage"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "customData"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "transactionStep"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" RENAME COLUMN "amount" TO "transferValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_a6376dce877de0841fe63085ad4" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_f4f1b2124aaac715c149460ef45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('only going up...');
  }
}
