import { MigrationInterface, QueryRunner } from 'typeorm';

export class CbeTransferEntity1757420276256 implements MigrationInterface {
  name = 'CbeTransferEntity1757420276256';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."cbe_transfer" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "debitTheirRef" character varying NOT NULL, "transactionId" integer NOT NULL, CONSTRAINT "REL_8d179b2bec6e57c9215780e7aa" UNIQUE ("transactionId"), CONSTRAINT "PK_4576ac3800975db32bae7cb6723" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e58523e28990976920f9a4c34b" ON "121-service"."cbe_transfer" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."cbe_transfer" ADD CONSTRAINT "FK_8d179b2bec6e57c9215780e7aad" FOREIGN KEY ("transactionId") REFERENCES "121-service"."transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Data migration from transaction.customData to cbe_transfer
    await queryRunner.query(`
      INSERT INTO "121-service"."cbe_transfer" ("debitTheirRef", "transactionId", "created", "updated")
      SELECT
        (t."customData"::jsonb -> 'requestResult' ->> 'debitTheirRef')::character varying as "debitTheirRef",
        t."id" as "transactionId",
        t."created",
        t."updated"
      FROM "121-service"."transaction" t
      LEFT JOIN "121-service"."program_fsp_configuration" pfc
        ON t."programFspConfigurationId" = pfc.id
      WHERE pfc."fspName" = 'Commercial-bank-ethiopia'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."cbe_transfer" DROP CONSTRAINT "FK_8d179b2bec6e57c9215780e7aad"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_e58523e28990976920f9a4c34b"`,
    );
    await queryRunner.query(`DROP TABLE "121-service"."cbe_transfer"`);
  }
}
