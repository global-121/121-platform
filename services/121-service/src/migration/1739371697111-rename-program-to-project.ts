import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameProgramToProject1739371697111 implements MigrationInterface {
  name = 'RenameProgramToProject1739371697111';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop contraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d8a56a1864ef40e1551833430bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d3c35664dbb056d04694819316e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f"`,
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
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52"`,
    );
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d3c35664dbb056d04694819316"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d8a56a1864ef40e1551833430b"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f2257d31c7aabd2568ea3093ed"`,
    );
    // Drop more contraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "registrationProgramAttributeUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "registrationProgramUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "uniqueTemplatePerTypeLanguageProgram"`,
    );
    // Rename columns
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" RENAME COLUMN "programRegistrationAttributeId" TO "projectRegistrationAttributeId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" RENAME COLUMN "programId" TO "projectId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" RENAME COLUMN "programId" TO "projectId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."whatsapp_template_test" RENAME COLUMN "programId" TO "projectId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_voucher_instruction" RENAME COLUMN "programId" TO "projectId"`,
    );

    // Rename tables
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" RENAME TO "project_financial_service_provider_configuration_property"`,
    );
    // await queryRunner.query(
    //     `CREATE INDEX "IDX_f0e87583b7f6dfcdfaebb696ef" ON "121-service"."project_financial_service_provider_configuration_property" ("created") `,
    //   );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" RENAME TO "project_financial_service_provider_configuration"`,
    );
    // await queryRunner.query(
    //     `CREATE INDEX "IDX_103691dfea98011c4d43dab76c" ON "121-service"."project_financial_service_provider_configuration" ("created") `,
    //   );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" RENAME TO "project_registration_attribute"`,
    );
    // await queryRunner.query(
    //     `CREATE INDEX "IDX_d4b58ae5fff2496f1da267a01c" ON "121-service"."project_registration_attribute" ("created") `,
    //   );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" RENAME TO "project"`,
    );
    // await queryRunner.query(
    //     `CREATE INDEX "IDX_09e3cb480f23f8d59ae50a0984" ON "121-service"."project" ("created") `,
    //   );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" RENAME TO "project_aidworker_assignment"`,
    );
    // await queryRunner.query(
    //   `CREATE INDEX "IDX_50e80892202c66fb232755173b" ON "121-service"."project_aidworker_assignment" ("created") `,
    // );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment_roles_user_role" RENAME TO "project_aidworker_assignment_roles_user_role"`,
    );
    // await queryRunner.query(
    //   `CREATE INDEX "IDX_8d869b02ca4f44ea0102c16bfe" ON "121-service"."project_aidworker_assignment_roles_user_role" ("projectAidworkerAssignmentId") `,
    // );
    // await queryRunner.query(
    //   `CREATE INDEX "IDX_e5feb050d3b610c6e9008edfbd" ON "121-service"."project_aidworker_assignment_roles_user_role" ("userRoleId") `,
    // );

    // Rename more columns
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" RENAME COLUMN "programId" TO "projectId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "projectFinancialServiceProviderConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "programId" TO "projectId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "registrationProgramId" TO "registrationProjectId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "projectFinancialServiceProviderConfigurationId"`,
    );

    // Add indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_d5e1fdbbc0bc0cbc3fc2e202d7" ON "121-service"."transaction" ("projectId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c3a8fb6575fab35938bb7595b3" ON "121-service"."transaction" ("projectFinancialServiceProviderConfigurationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bc9119239d5bd0994682a6732f" ON "121-service"."registration" ("registrationProjectId") `,
    );
    // Add constraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "registrationProjectAttributeUnique" UNIQUE ("registrationId", "projectRegistrationAttributeId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "registrationProjectUnique" UNIQUE ("projectId", "registrationProjectId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "uniqueTemplatePerTypeLanguageProject" UNIQUE ("type", "language", "projectId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."project_financial_service_provider_configuration_property" ADD CONSTRAINT "FK_5ce0ac4d1461a28a639ecd4808e" FOREIGN KEY ("projectFinancialServiceProviderConfigurationId") REFERENCES "121-service"."project_financial_service_provider_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."project_financial_service_provider_configuration" ADD CONSTRAINT "FK_e6b974a6e3a3a1546e7b017ce68" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d5e1fdbbc0bc0cbc3fc2e202d7f" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_c3a8fb6575fab35938bb7595b3b" FOREIGN KEY ("projectFinancialServiceProviderConfigurationId") REFERENCES "121-service"."project_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
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
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_1cd9a70c74da19822c8c02bca80" FOREIGN KEY ("projectFinancialServiceProviderConfigurationId") REFERENCES "121-service"."project_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_7aa669b5d45a9916651005fb8cc" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_a531dfb386d5a3cd5535360c45d" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."project_aidworker_assignment" ADD CONSTRAINT "FK_961f169408a77e18e19765cca27" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."project_aidworker_assignment" ADD CONSTRAINT "FK_2519423f484cbd2b1d021d2bc46" FOREIGN KEY ("projectId") REFERENCES "121-service"."project"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
    // Create view
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."projectId" AS "projectId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "projectFinancialServiceProviderConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProjectId") as VARCHAR) AS "personAffectedSequence", registration."registrationProjectId" AS "registrationProjectId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", fspconfig."name" AS "projectFinancialServiceProviderConfigurationName", fspconfig."id" AS "projectFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."project_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."projectFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProjectId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."projectId" AS "projectId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "projectFinancialServiceProviderConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProjectId") as VARCHAR) AS "personAffectedSequence", registration."registrationProjectId" AS "registrationProjectId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", fspconfig."name" AS "projectFinancialServiceProviderConfigurationName", fspconfig."id" AS "projectFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."project_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."projectFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProjectId" ASC',
      ],
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // ##TODO: Do we need to create a down migration?
    // await queryRunner.query(
    //   `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
    //   ['VIEW', 'registration_view', '121-service'],
    // );
    // await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_e5feb050d3b610c6e9008edfbda"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."project_aidworker_assignment_roles_user_role" DROP CONSTRAINT "FK_8d869b02ca4f44ea0102c16bfed"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."intersolve_voucher_instruction" DROP CONSTRAINT "FK_c79edeabacf7c9f57f18eb1c398"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."project_aidworker_assignment" DROP CONSTRAINT "FK_2519423f484cbd2b1d021d2bc46"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."project_aidworker_assignment" DROP CONSTRAINT "FK_961f169408a77e18e19765cca27"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "FK_a531dfb386d5a3cd5535360c45d"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."action" DROP CONSTRAINT "FK_7aa669b5d45a9916651005fb8cc"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_1cd9a70c74da19822c8c02bca80"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_198f8684a88021ab0e582e96c36"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_fed2e5f03b41f1e80706fa11c5e"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."project_registration_attribute" DROP CONSTRAINT "FK_f8b499e184ee720b813aae77775"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_c3a8fb6575fab35938bb7595b3b"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d5e1fdbbc0bc0cbc3fc2e202d7f"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."project_financial_service_provider_configuration" DROP CONSTRAINT "FK_e6b974a6e3a3a1546e7b017ce68"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."project_financial_service_provider_configuration_property" DROP CONSTRAINT "FK_5ce0ac4d1461a28a639ecd4808e"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."message_template" DROP CONSTRAINT "uniqueTemplatePerTypeLanguageProject"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "registrationProjectUnique"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "registrationProjectAttributeUnique"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_bc9119239d5bd0994682a6732f"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_c3a8fb6575fab35938bb7595b3"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_d5e1fdbbc0bc0cbc3fc2e202d7"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" DROP COLUMN "registrationProjectId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" DROP COLUMN "projectFinancialServiceProviderConfigurationId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" DROP COLUMN "projectId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" DROP COLUMN "projectFinancialServiceProviderConfigurationId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" DROP COLUMN "projectId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" ADD "programFinancialServiceProviderConfigurationId" integer`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" ADD "registrationProgramId" integer NOT NULL`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" ADD "programId" integer NOT NULL`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" ADD "programFinancialServiceProviderConfigurationId" integer`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" ADD "programId" integer NOT NULL`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_e5feb050d3b610c6e9008edfbd"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_8d869b02ca4f44ea0102c16bfe"`,
    // );
    // await queryRunner.query(
    //   `DROP TABLE "121-service"."project_aidworker_assignment_roles_user_role"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_50e80892202c66fb232755173b"`,
    // );
    // await queryRunner.query(
    //   `DROP TABLE "121-service"."project_aidworker_assignment"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_09e3cb480f23f8d59ae50a0984"`,
    // );
    // await queryRunner.query(`DROP TABLE "121-service"."project"`);
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_d4b58ae5fff2496f1da267a01c"`,
    // );
    // await queryRunner.query(
    //   `DROP TABLE "121-service"."project_registration_attribute"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_103691dfea98011c4d43dab76c"`,
    // );
    // await queryRunner.query(
    //   `DROP TABLE "121-service"."project_financial_service_provider_configuration"`,
    // );
    // await queryRunner.query(
    //   `DROP INDEX "121-service"."IDX_f0e87583b7f6dfcdfaebb696ef"`,
    // );
    // await queryRunner.query(
    //   `DROP TABLE "121-service"."project_financial_service_provider_configuration_property"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."intersolve_voucher_instruction" RENAME COLUMN "projectId" TO "programId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."whatsapp_template_test" RENAME COLUMN "projectId" TO "programId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."message_template" RENAME COLUMN "projectId" TO "programId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."action" RENAME COLUMN "projectId" TO "programId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration_attribute_data" RENAME COLUMN "projectRegistrationAttributeId" TO "programRegistrationAttributeId"`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "uniqueTemplatePerTypeLanguageProgram" UNIQUE ("type", "language", "programId")`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "registrationProgramUnique" UNIQUE ("programId", "registrationProgramId")`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "registrationProgramAttributeUnique" UNIQUE ("registrationId", "programRegistrationAttributeId")`,
    // );
    // await queryRunner.query(
    //   `CREATE INDEX "IDX_f2257d31c7aabd2568ea3093ed" ON "121-service"."registration" ("registrationProgramId") `,
    // );
    // await queryRunner.query(
    //   `CREATE INDEX "IDX_d8a56a1864ef40e1551833430b" ON "121-service"."transaction" ("programFinancialServiceProviderConfigurationId") `,
    // );
    // await queryRunner.query(
    //   `CREATE INDEX "IDX_d3c35664dbb056d04694819316" ON "121-service"."transaction" ("programId") `,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."intersolve_voucher_instruction" ADD CONSTRAINT "FK_a4b70f5b341879f17bd410e8d52" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."message_template" ADD CONSTRAINT "FK_55ebe1d2e603be11a0cfc97372f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."action" ADD CONSTRAINT "FK_20a407367336fd4352de7f8138f" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_5423104a960c57439e028eb57c5" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060" FOREIGN KEY ("programRegistrationAttributeId") REFERENCES "121-service"."program_registration_attribute"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d3c35664dbb056d04694819316e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    // );
    // await queryRunner.query(
    //   `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d8a56a1864ef40e1551833430bb" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    // );
  }
}
