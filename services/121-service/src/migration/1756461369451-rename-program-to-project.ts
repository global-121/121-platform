import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameProgramToProject1756461369451 implements MigrationInterface {
  name = 'RenameProgramToProject1756461369451';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // TypeORM migration generation has a hard time with large scale renamings.
    // So we had to create 3 separate migrations, this is the combination of
    // those 3.

    ////////////////////////////////////////////////////////////////////////////
    // This is the first auto-generated migration, with edits so that DROP TABLE
    // and CREATE TABLE are changed into ALTER TABLE RENAME
    ////////////////////////////////////////////////////////////////////////////
    if (true) {
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment" DROP CONSTRAINT "FK_0f8f281d1010c17f17ff240328a"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_5423104a960c57439e028eb57c5"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_20a407367336fd4352de7f8138f"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_fff8ff586a03d469256098b8f8"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_f2257d31c7aabd2568ea3093ed"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "registrationProgramUnique"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "uniqueTemplatePerTypeLanguageProgram"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "registrationProgramAttributeUnique"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_fsp_configuration_property" RENAME COLUMN "programFspConfigurationId" TO "projectFspConfigurationId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."transaction" RENAME COLUMN "programFspConfigurationId" TO "projectFspConfigurationId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_fsp_configuration" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_aidworker_assignment" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."action" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_registration_attribute" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" RENAME COLUMN "programRegistrationAttributeId" TO "projectRegistrationAttributeId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."whatsapp_template_test" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_attachment" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."intersolve_voucher_instruction" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" RENAME COLUMN "programAidworkerAssignmentId" TO "projectAidworkerAssignmentId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_fsp_configuration_property" RENAME TO "project_fsp_configuration_property"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_fsp_configuration" RENAME TO "project_fsp_configuration"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_aidworker_assignment" RENAME TO "project_aidworker_assignment"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_attachment" RENAME TO "project_attachment"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program" RENAME TO "project"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_registration_attribute" RENAME TO "project_registration_attribute"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" RENAME TO "project_aidworker_assignment_roles_user_role"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" RENAME COLUMN "programId" TO "projectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" RENAME COLUMN "registrationProgramId" TO "registrationProjectId"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" RENAME COLUMN "programFspConfigurationId" TO "projectFspConfigurationId"`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_295ef46ff97a36a0699c026667" ON "121-service"."transaction" ("projectFspConfigurationId") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_bc9119239d5bd0994682a6732f" ON "121-service"."registration" ("registrationProjectId") `,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "registrationProjectUnique" UNIQUE ("projectId", "registrationProjectId")`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "uniqueTemplatePerTypeLanguageProject" UNIQUE ("type", "language", "projectId")`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "registrationProjectAttributeUnique" UNIQUE ("registrationId", "projectRegistrationAttributeId")`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment" ADD CONSTRAINT "FK_8846e403ec45e1ad8c309f91a37" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" ADD CONSTRAINT "FK_4ee79bf3b2f53aec8acbc35fea6" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" ADD CONSTRAINT "FK_f43916b9b27d19ad94384df6655" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_295ef46ff97a36a0699c026667d" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_198f8684a88021ab0e582e96c36" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_f069ce9765ba5b29c7e0ff1a95b" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ADD CONSTRAINT "FK_961f169408a77e18e19765cca27" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ADD CONSTRAINT "FK_2519423f484cbd2b1d021d2bc46" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" ADD CONSTRAINT "FK_a2d11c0aba016e199507bdaf8b4" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" ADD CONSTRAINT "FK_65af183bc096a19e1146ee84b54" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_7aa669b5d45a9916651005fb8cc" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_a531dfb386d5a3cd5535360c45d" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ADD CONSTRAINT "FK_f8b499e184ee720b813aae77775" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_fed2e5f03b41f1e80706fa11c5e" FOREIGN KEY ("projectRegistrationAttributeId") REFERENCES "121-service"."project_registration_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_c79edeabacf7c9f57f18eb1c398" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_8d869b02ca4f44ea0102c16bfed" FOREIGN KEY ("projectAidworkerAssignmentId") REFERENCES "121-service"."project_aidworker_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_e5feb050d3b610c6e9008edfbda" FOREIGN KEY ("userRoleId") REFERENCES "121-service"."user_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );

      await queryRunner.query(
        `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
        ['VIEW', 'registration_view', '121-service'],
      );
      await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);

      await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."projectId" AS "projectId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "projectFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProjectId") as VARCHAR) AS "personAffectedSequence", registration."registrationProjectId" AS "registrationProjectId", fspconfig."name" AS "projectFspConfigurationName", fspconfig."id" AS "projectFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus",
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."project_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."projectFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."projectRegistrationAttributeId" = d2."projectRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."project_registration_attribute" "pra" ON d1."projectRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND
              NOT EXISTS (
                SELECT 1
                FROM "121-service".unique_registration_pair rup
                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")
                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")
              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProjectId" ASC`);
      await queryRunner.query(
        `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
        [
          '121-service',
          'VIEW',
          'registration_view',
          'SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."projectId" AS "projectId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "projectFspConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProjectId") as VARCHAR) AS "personAffectedSequence", registration."registrationProjectId" AS "registrationProjectId", fspconfig."name" AS "projectFspConfigurationName", fspconfig."id" AS "projectFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN \'duplicate\'\n        ELSE \'unique\'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."project_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."projectFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."projectRegistrationAttributeId" = d2."projectRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != \'declined\'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != \'declined\'  INNER JOIN "121-service"."project_registration_attribute" "pra" ON d1."projectRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != \'\' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProjectId" ASC',
        ],
      );
    }

    ///////////////////////////////////////////////
    // This is the second auto-generated migration.
    ///////////////////////////////////////////////
    if (true) {
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" DROP CONSTRAINT "FK_23260bdde9cee10304192140b77"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" DROP CONSTRAINT "FK_8788ebf12909c03049a0d8c377d"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" DROP CONSTRAINT "FK_6be88e8576970978a911084534e"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" DROP CONSTRAINT "FK_1315d078dc3df552bba424c032b"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" DROP CONSTRAINT "FK_b60be4bf492f3ee8745dfee8806"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" DROP CONSTRAINT "FK_bed7ec4e8c775261cb9960b700f"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" DROP CONSTRAINT "FK_28fad6e9cfc39949b09a84437ea"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_55d6e02b7aed4a6cbd027cc97d6"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_8b938a5145fb00a8e324504f620"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_4b9a24d5c15e92e661112633fd"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_1387f030d9f04f7d80c78a60d5"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_e9c1fabe6ed57e114b586d3445"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_0e82cb4d2ae009af92e6fb7271"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_42cca4c665cd14fc597e7a5227"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_bc351c7a1289829b04cb2b22b0"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_8b938a5145fb00a8e324504f62"`,
      );
      await queryRunner.query(
        `DROP INDEX "121-service"."IDX_55d6e02b7aed4a6cbd027cc97d"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" DROP CONSTRAINT "CHK_c228a4df10e774f22e14834d35"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" DROP CONSTRAINT "programFspConfigurationPropertyUnique"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" DROP CONSTRAINT "programAttributeUnique"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" DROP CONSTRAINT "programFspConfigurationUnique"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" DROP CONSTRAINT "userProgramAssignmentUnique"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project" RENAME COLUMN "aboutProgram" TO "aboutProject"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_fsp_configuration_property_id_seq" OWNED BY "121-service"."project_fsp_configuration_property"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_fsp_configuration_property_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" ALTER COLUMN "id" DROP DEFAULT`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_fed2e5f03b41f1e80706fa11c5e"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_registration_attribute_id_seq" OWNED BY "121-service"."project_registration_attribute"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_registration_attribute_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ALTER COLUMN "id" DROP DEFAULT`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_295ef46ff97a36a0699c026667d"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_f069ce9765ba5b29c7e0ff1a95b"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" DROP CONSTRAINT "FK_4ee79bf3b2f53aec8acbc35fea6"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_fsp_configuration_id_seq" OWNED BY "121-service"."project_fsp_configuration"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_fsp_configuration_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" ALTER COLUMN "id" DROP DEFAULT`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_8d869b02ca4f44ea0102c16bfed"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_aidworker_assignment_id_seq" OWNED BY "121-service"."project_aidworker_assignment"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_aidworker_assignment_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ALTER COLUMN "id" DROP DEFAULT`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_attachment_id_seq" OWNED BY "121-service"."project_attachment"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_attachment_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" ALTER COLUMN "id" DROP DEFAULT`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_c79edeabacf7c9f57f18eb1c398"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" DROP CONSTRAINT "FK_2519423f484cbd2b1d021d2bc46"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_7aa669b5d45a9916651005fb8cc"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_198f8684a88021ab0e582e96c36"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_a531dfb386d5a3cd5535360c45d"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" DROP CONSTRAINT "FK_f43916b9b27d19ad94384df6655"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" DROP CONSTRAINT "FK_a2d11c0aba016e199507bdaf8b4"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" DROP CONSTRAINT "FK_f8b499e184ee720b813aae77775"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment" DROP CONSTRAINT "FK_8846e403ec45e1ad8c309f91a37"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_id_seq" OWNED BY "121-service"."project"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project" ALTER COLUMN "id" DROP DEFAULT`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_e961f94fc3ae9341e53c367542" ON "121-service"."project_fsp_configuration_property" ("created") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_d4b58ae5fff2496f1da267a01c" ON "121-service"."project_registration_attribute" ("created") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_36b5274a9996941ec0dbae4851" ON "121-service"."project_fsp_configuration" ("created") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_50e80892202c66fb232755173b" ON "121-service"."project_aidworker_assignment" ("created") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_137db5fe88e1fb281ba1d4ae9c" ON "121-service"."project_attachment" ("created") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_09e3cb480f23f8d59ae50a0984" ON "121-service"."project" ("created") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_8d869b02ca4f44ea0102c16bfe" ON "121-service"."project_aidworker_assignment_roles_user_role" ("projectAidworkerAssignmentId") `,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_e5feb050d3b610c6e9008edfbd" ON "121-service"."project_aidworker_assignment_roles_user_role" ("userRoleId") `,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ADD CONSTRAINT "CHK_a83edac53966622ab4592d99c1" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'fsp', 'registrationProjectId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" ADD CONSTRAINT "projectFspConfigurationPropertyUnique" UNIQUE ("projectFspConfigurationId", "name")`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ADD CONSTRAINT "projectAttributeUnique" UNIQUE ("name", "projectId")`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" ADD CONSTRAINT "projectFspConfigurationUnique" UNIQUE ("projectId", "name")`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ADD CONSTRAINT "userProjectAssignmentUnique" UNIQUE ("userId", "projectId")`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_a531dfb386d5a3cd5535360c45d" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" ADD CONSTRAINT "FK_4ee79bf3b2f53aec8acbc35fea6" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ADD CONSTRAINT "FK_f8b499e184ee720b813aae77775" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_fed2e5f03b41f1e80706fa11c5e" FOREIGN KEY ("projectRegistrationAttributeId") REFERENCES "121-service"."project_registration_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_198f8684a88021ab0e582e96c36" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_f069ce9765ba5b29c7e0ff1a95b" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" ADD CONSTRAINT "FK_f43916b9b27d19ad94384df6655" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_295ef46ff97a36a0699c026667d" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment" ADD CONSTRAINT "FK_8846e403ec45e1ad8c309f91a37" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ADD CONSTRAINT "FK_2519423f484cbd2b1d021d2bc46" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" ADD CONSTRAINT "FK_a2d11c0aba016e199507bdaf8b4" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_7aa669b5d45a9916651005fb8cc" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_c79edeabacf7c9f57f18eb1c398" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_8d869b02ca4f44ea0102c16bfed" FOREIGN KEY ("projectAidworkerAssignmentId") REFERENCES "121-service"."project_aidworker_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      );
    }

    //////////////////////////////////////////////
    // This is the third auto-generated migration.
    //////////////////////////////////////////////
    if (true) {
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_fsp_configuration_property_id_seq" OWNED BY "121-service"."project_fsp_configuration_property"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_fsp_configuration_property_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_fed2e5f03b41f1e80706fa11c5e"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_registration_attribute_id_seq" OWNED BY "121-service"."project_registration_attribute"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_registration_attribute_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_295ef46ff97a36a0699c026667d"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_f069ce9765ba5b29c7e0ff1a95b"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" DROP CONSTRAINT "FK_4ee79bf3b2f53aec8acbc35fea6"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_fsp_configuration_id_seq" OWNED BY "121-service"."project_fsp_configuration"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_fsp_configuration_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_8d869b02ca4f44ea0102c16bfed"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_aidworker_assignment_id_seq" OWNED BY "121-service"."project_aidworker_assignment"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_aidworker_assignment_id_seq"')`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_attachment_id_seq" OWNED BY "121-service"."project_attachment"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_attachment_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_c79edeabacf7c9f57f18eb1c398"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" DROP CONSTRAINT "FK_2519423f484cbd2b1d021d2bc46"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_7aa669b5d45a9916651005fb8cc"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_198f8684a88021ab0e582e96c36"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_a531dfb386d5a3cd5535360c45d"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" DROP CONSTRAINT "FK_f43916b9b27d19ad94384df6655"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" DROP CONSTRAINT "FK_a2d11c0aba016e199507bdaf8b4"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" DROP CONSTRAINT "FK_f8b499e184ee720b813aae77775"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment" DROP CONSTRAINT "FK_8846e403ec45e1ad8c309f91a37"`,
      );
      await queryRunner.query(
        `CREATE SEQUENCE IF NOT EXISTS "121-service"."project_id_seq" OWNED BY "121-service"."project"."id"`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."project_id_seq"')`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_a531dfb386d5a3cd5535360c45d" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration_property" ADD CONSTRAINT "FK_4ee79bf3b2f53aec8acbc35fea6" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_registration_attribute" ADD CONSTRAINT "FK_f8b499e184ee720b813aae77775" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_fed2e5f03b41f1e80706fa11c5e" FOREIGN KEY ("projectRegistrationAttributeId") REFERENCES "121-service"."project_registration_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_198f8684a88021ab0e582e96c36" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_f069ce9765ba5b29c7e0ff1a95b" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_fsp_configuration" ADD CONSTRAINT "FK_f43916b9b27d19ad94384df6655" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_295ef46ff97a36a0699c026667d" FOREIGN KEY ("projectFspConfigurationId") REFERENCES "121-service"."project_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment" ADD CONSTRAINT "FK_8846e403ec45e1ad8c309f91a37" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment" ADD CONSTRAINT "FK_2519423f484cbd2b1d021d2bc46" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_attachment" ADD CONSTRAINT "FK_a2d11c0aba016e199507bdaf8b4" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_7aa669b5d45a9916651005fb8cc" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_c79edeabacf7c9f57f18eb1c398" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
      );
      await queryRunner.query(
        `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" ADD CONSTRAINT "FK_8d869b02ca4f44ea0102c16bfed" FOREIGN KEY ("projectAidworkerAssignmentId") REFERENCES "121-service"."project_aidworker_assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      );
    }
  }

  public async down(): Promise<void> {
    console.log("We don't do downgrades.");
  }
}
