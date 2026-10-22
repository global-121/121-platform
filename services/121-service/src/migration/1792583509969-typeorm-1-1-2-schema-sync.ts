import { MigrationInterface, QueryRunner } from 'typeorm';

export class Typeorm112SchemaSync1792583509969 implements MigrationInterface {
  name = 'Typeorm112SchemaSync1792583509969';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropTransactionView(queryRunner);
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" DROP CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_55d6e02b7aed4a6cbd027cc97d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" ADD CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95" FOREIGN KEY ("permissionId") REFERENCES "121-service"."permission"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_55d6e02b7aed4a6cbd027cc97d6" FOREIGN KEY ("userRoleId") REFERENCES "121-service"."user_role"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."referenceId" AS "referenceId", "registration"."registrationStatus" AS "status", "registration"."programId" AS "programId", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentCount" AS "paymentCount", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", "registration"."paymentAmountMultiplier" * program."fixedTransferValue" AS "transferValue", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus", 
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."program" "program" ON "program"."id"="registration"."programId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id" LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND 
              NOT EXISTS (
                SELECT 1
                FROM "121-service".unique_registration_pair rup
                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."referenceId" AS "referenceId", "registration"."registrationStatus" AS "status", "registration"."programId" AS "programId", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentCount" AS "paymentCount", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", "registration"."paymentAmountMultiplier" * program."fixedTransferValue" AS "transferValue", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN \'duplicate\'\n        ELSE \'unique\'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."program" "program" ON "program"."id"="registration"."programId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id" LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != \'declined\'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != \'declined\'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != \'\' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
    await this.createTransactionView(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropTransactionView(queryRunner);
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_55d6e02b7aed4a6cbd027cc97d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" DROP CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_55d6e02b7aed4a6cbd027cc97d6" FOREIGN KEY ("userRoleId") REFERENCES "121-service"."user_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" ADD CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95" FOREIGN KEY ("permissionId") REFERENCES "121-service"."permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."referenceId" AS "referenceId", "registration"."registrationStatus" AS "status", "registration"."programId" AS "programId", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentCount" AS "paymentCount", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", "registration"."paymentAmountMultiplier" * program."fixedTransferValue" AS "transferValue", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus", 
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."program" "program" ON "program"."id"="registration"."programId"  LEFT JOIN ("121-service"."latest_message" "latestMessage" LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId") ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND 
              NOT EXISTS (
                SELECT 1
                FROM "121-service".unique_registration_pair rup
                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC`);
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."referenceId" AS "referenceId", "registration"."registrationStatus" AS "status", "registration"."programId" AS "programId", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentCount" AS "paymentCount", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", "registration"."paymentAmountMultiplier" * program."fixedTransferValue" AS "transferValue", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN \'duplicate\'\n        ELSE \'unique\'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."program" "program" ON "program"."id"="registration"."programId"  LEFT JOIN ("121-service"."latest_message" "latestMessage" LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId") ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != \'declined\'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != \'declined\'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != \'\' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
    await this.createTransactionView(queryRunner);
  }

  // transaction_view depends on registration_view, so it must be dropped first and recreated afterwards
  private async dropTransactionView(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'transaction_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."transaction_view"`);
  }

  private async createTransactionView(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "121-service"."transaction_view" AS SELECT "t"."id" AS "id", "t"."transferValue" AS "transferValue", "t"."userId" AS "userId", "t"."created" AS "created", "t"."updated" AS "updated", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."label" AS "programFspConfigurationLabel", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."fspName" AS "fspName", "registration"."registrationStatus" AS "registrationStatus", "registration"."registrationProgramId" AS "registrationProgramId", "registration"."referenceId" AS "registrationReferenceId", "registration"."scope" AS "registrationScope", "registrationview"."duplicateStatus" AS "registrationDuplicateStatus" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"  LEFT JOIN "121-service"."registration_view" "registrationview" ON "t"."registrationId" = "registrationview"."id"`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'transaction_view',
        'SELECT "t"."id" AS "id", "t"."transferValue" AS "transferValue", "t"."userId" AS "userId", "t"."created" AS "created", "t"."updated" AS "updated", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."label" AS "programFspConfigurationLabel", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."fspName" AS "fspName", "registration"."registrationStatus" AS "registrationStatus", "registration"."registrationProgramId" AS "registrationProgramId", "registration"."referenceId" AS "registrationReferenceId", "registration"."scope" AS "registrationScope", "registrationview"."duplicateStatus" AS "registrationDuplicateStatus" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"  LEFT JOIN "121-service"."registration_view" "registrationview" ON "t"."registrationId" = "registrationview"."id"',
      ],
    );
  }
}
