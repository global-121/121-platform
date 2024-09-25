import { MigrationInterface, QueryRunner } from 'typeorm';

export class FincancialServiceProviderConfigurationRefactor1726668618637
  implements MigrationInterface
{
  name = 'FincancialServiceProviderConfigurationRefactor1726668618637';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ba98ea5ca43ebe54f60c5aaabe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "fspId" TO "programFinancialServiceProviderConfigurationId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_financial_service_provider_configuration_property" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "value" character varying NOT NULL, "programFinancialServiceProviderConfigurationId" integer NOT NULL, CONSTRAINT "programFinancialServiceProviderConfigurationPropertyUnique" UNIQUE ("programFinancialServiceProviderConfigurationId", "name"), CONSTRAINT "PK_01dfd2b0e5d93a8cf4090254cfc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ea95dd85e592bad75d0278873" ON "121-service"."program_financial_service_provider_configuration_property" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_financial_service_provider_configuration" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "financialServiceProviderName" character varying NOT NULL, "name" character varying NOT NULL, "label" json NOT NULL, CONSTRAINT "programFinancialServiceProviderConfigurationUnique" UNIQUE ("programId", "name"), CONSTRAINT "PK_bc2d4d99fa94cb01d4566acdffc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04aac36fce58b33d30d71b700f" ON "121-service"."program_financial_service_provider_configuration" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_attribute_data" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "programRegistrationAttributeId" integer, "value" character varying NOT NULL, CONSTRAINT "registrationProgramAttributeUnique" UNIQUE ("registrationId", "programRegistrationAttributeId"), CONSTRAINT "PK_bef7662581d64d69db3f6405411" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29cd6ac9bf4002df266d0ba23e" ON "121-service"."registration_attribute_data" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8914b71c0e30c44291ab68a9b8" ON "121-service"."registration_attribute_data" ("registrationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3037018a626cd41bd16c588170" ON "121-service"."registration_attribute_data" ("value") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "financialServiceProviderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "programFinancialServiceProviderConfigurationId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "programFinancialServiceProviderConfigurationConfigurationId" integer`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d8a56a1864ef40e1551833430b" ON "121-service"."transaction" ("programFinancialServiceProviderConfigurationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" ADD CONSTRAINT "FK_5e40569627925419cd94db0da36" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_f7400125e09c4d8fec5747ec588" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_c4308a455ed658828fab537bb38" FOREIGN KEY ("programFinancialServiceProviderConfigurationConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_8914b71c0e30c44291ab68a9b8a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" ADD CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060" FOREIGN KEY ("programRegistrationAttributeId") REFERENCES "121-service"."program_registration_attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "fspDisplayName", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "fspDisplayName", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_3bd62b57d06901bcd85e28fd060"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_attribute_data" DROP CONSTRAINT "FK_8914b71c0e30c44291ab68a9b8a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_c4308a455ed658828fab537bb38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" DROP CONSTRAINT "FK_f7400125e09c4d8fec5747ec588"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" DROP CONSTRAINT "FK_5e40569627925419cd94db0da36"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d8a56a1864ef40e1551833430b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programFinancialServiceProviderConfigurationConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "programFinancialServiceProviderConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD "financialServiceProviderId" integer NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3037018a626cd41bd16c588170"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_8914b71c0e30c44291ab68a9b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_29cd6ac9bf4002df266d0ba23e"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."registration_attribute_data"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_04aac36fce58b33d30d71b700f"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_financial_service_provider_configuration"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2ea95dd85e592bad75d0278873"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_financial_service_provider_configuration_property"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "fspId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba98ea5ca43ebe54f60c5aaabe" ON "121-service"."transaction" ("financialServiceProviderId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."displayName" AS "fspDisplayName", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."displayName" AS "fspDisplayName", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }
}
