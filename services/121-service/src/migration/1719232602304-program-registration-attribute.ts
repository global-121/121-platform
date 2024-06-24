import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramRegistrationAttribute1719232602304
  implements MigrationInterface
{
  name = 'ProgramRegistrationAttribute1719232602304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_registration_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "label" json NOT NULL, "type" character varying NOT NULL, "isRequired" boolean NOT NULL, "placeholder" json, "options" json, "scoring" json NOT NULL, "programId" integer NOT NULL, "export" json NOT NULL DEFAULT '["all-people-affected","included"]', "pattern" character varying, "duplicateCheck" boolean NOT NULL DEFAULT false, "showInPeopleAffectedTable" boolean NOT NULL DEFAULT false, "editableInPortal" boolean NOT NULL DEFAULT false, CONSTRAINT "programAttributeUnique" UNIQUE ("name", "programId"), CONSTRAINT "CHK_88f5ede846c87b3059ed09f967" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate')), CONSTRAINT "PK_b85642d2f95cc2fcc6145e14463" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1387f030d9f04f7d80c78a60d5" ON "121-service"."program_registration_attribute" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD "programRegistrationAttributeId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD CONSTRAINT "FK_8788ebf12909c03049a0d8c377d" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_cf696382c2af3359aedf7b52c59" FOREIGN KEY ("programRegistrationAttributeId") REFERENCES "121-service"."program_registration_attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_cf696382c2af3359aedf7b52c59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP CONSTRAINT "FK_8788ebf12909c03049a0d8c377d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_data" DROP COLUMN "programRegistrationAttributeId"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_1387f030d9f04f7d80c78a60d5"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_registration_attribute"`,
    );
  }
}
