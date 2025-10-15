import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionEvents1760532935192 implements MigrationInterface {
  name = 'TransactionEvents1760532935192';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_edc9246b11c7368ca48fce10f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_fff8ff586a03d469256098b8f8"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."transaction_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "type" character varying NOT NULL, "description" character varying NOT NULL, "isSuccessfullyCompleted" boolean NOT NULL, "errorMessage" character varying, "transactionId" integer NOT NULL, "programFspConfigurationId" integer, CONSTRAINT "PK_1b4101c76f4a2c8168aeb8f3bad" PRIMARY KEY ("id"))`,
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
      `CREATE INDEX "IDX_ccc33883aa7599801353e53cf1" ON "121-service"."transaction_event" ("programFspConfigurationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."last_transaction_event" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "transactionId" integer NOT NULL, "transactionEventId" integer NOT NULL, CONSTRAINT "REL_3c4cceaad30f521ac0074c45ad" UNIQUE ("transactionId"), CONSTRAINT "REL_0de93dafac190577420226cf69" UNIQUE ("transactionEventId"), CONSTRAINT "PK_c0093d25972670d66a61268ef37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_318d184fe0086105b4615c0078" ON "121-service"."last_transaction_event" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c4cceaad30f521ac0074c45ad" ON "121-service"."last_transaction_event" ("transactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0de93dafac190577420226cf69" ON "121-service"."last_transaction_event" ("transactionEventId") `,
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
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "amount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "transferValue" real`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "UQ_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "UQ_5ad8525fef1696e4388e007b4bc" UNIQUE ("registrationId", "paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_a6376dce877de0841fe63085ad4" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_f4f1b2124aaac715c149460ef45" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" ADD CONSTRAINT "FK_ccc33883aa7599801353e53cf19" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."last_transaction_event" ADD CONSTRAINT "FK_3c4cceaad30f521ac0074c45ad7" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."last_transaction_event" ADD CONSTRAINT "FK_0de93dafac190577420226cf69f" FOREIGN KEY ("transactionEventId") REFERENCES "121-service"."transaction_event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_cd56d3267e8553557ec97c6741b" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."transaction_view_entity" AS SELECT "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."fspName" AS "fspName", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."label" AS "programFspConfigurationLabel", t.* FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'transaction_view_entity',
        'SELECT "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."fspName" AS "fspName", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."label" AS "programFspConfigurationLabel", t.* FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'transaction_view_entity', '121-service'],
    );
    await queryRunner.query(
      `DROP VIEW "121-service"."transaction_view_entity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_cd56d3267e8553557ec97c6741b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."last_transaction_event" DROP CONSTRAINT "FK_0de93dafac190577420226cf69f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."last_transaction_event" DROP CONSTRAINT "FK_3c4cceaad30f521ac0074c45ad7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" DROP CONSTRAINT "FK_ccc33883aa7599801353e53cf19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" DROP CONSTRAINT "FK_f4f1b2124aaac715c149460ef45"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction_event" DROP CONSTRAINT "FK_a6376dce877de0841fe63085ad4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "UQ_5ad8525fef1696e4388e007b4bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "UQ_cd56d3267e8553557ec97c6741b" UNIQUE ("transactionId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_cd56d3267e8553557ec97c6741b" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "transferValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "programFspConfigurationId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "amount" real`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "transactionStep" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "customData" json NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "errorMessage" character varying`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_0de93dafac190577420226cf69"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3c4cceaad30f521ac0074c45ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_318d184fe0086105b4615c0078"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."last_transaction_event"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ccc33883aa7599801353e53cf1"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f4f1b2124aaac715c149460ef4"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_695faaebd651cc12b4b295880d"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_b636b04e270121a24f08d1af9b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."transaction_event"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_fff8ff586a03d469256098b8f8" ON "121-service"."transaction" ("programFspConfigurationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_edc9246b11c7368ca48fce10f4" ON "121-service"."transaction" ("transactionStep") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
