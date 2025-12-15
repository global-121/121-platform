import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameFinancialServiceProviderToFsp1749809825697 implements MigrationInterface {
  name = 'RenameFinancialServiceProviderToFsp1749809825697';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ## TODO: I was able to get to a successful migration after generating the migration scripts 3 times. See below. Do we want to refactor these queries into 1 "clean" set?
    /////////////////////////////////////////////
    // This is the first auto-generated migration, with edits so that DROP TABLE and CREATE TABLE are changed into ALTER TABLE RENAME
    ////////////////////////////////////////////
    // Drop view
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);

    // Drop constraints and indexes
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d8a56a1864ef40e1551833430bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_148b6bb5c37ca2d444b01c00c2f"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d8a56a1864ef40e1551833430b"`,
    );
    // Rename tables
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" RENAME TO "program_fsp_configuration_property"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" RENAME TO "program_fsp_configuration"`,
    );
    // Rename columns
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" RENAME COLUMN "programFinancialServiceProviderConfigurationId" TO "programFspConfigurationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" RENAME COLUMN "financialServiceProviderName" TO "fspName"`,
    );

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_4b9a24d5c15e92e661112633fd" ON "121-service"."program_fsp_configuration_property" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9c1fabe6ed57e114b586d3445" ON "121-service"."program_fsp_configuration" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fff8ff586a03d469256098b8f8" ON "121-service"."transaction" ("programFspConfigurationId") `,
    );
    // Create FK constraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "FK_23260bdde9cee10304192140b77" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_6be88e8576970978a911084534e" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    // Create unique constraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "programFspConfigurationPropertyUnique" UNIQUE ("programFspConfigurationId", "name")`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "programFspConfigurationUnique" UNIQUE ("programId", "name")`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP CONSTRAINT "CHK_88f5ede846c87b3059ed09f967"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD CONSTRAINT "CHK_c228a4df10e774f22e14834d35" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'fsp', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate'))`,
    );
    await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus",
        (CASE
            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'
        ELSE 'unique'
        END)
         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND
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
        'SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN \'duplicate\'\n        ELSE \'unique\'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != \'declined\'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != \'declined\'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != \'\' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
    /////////////////////////////////////////////
    // This is the second auto-generated migration, to add missing stuff and give stuff the correct names.
    ////////////////////////////////////////////
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "FK_5e40569627925419cd94db0da36"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_f7400125e09c4d8fec5747ec588"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_2ea95dd85e592bad75d0278873"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_04aac36fce58b33d30d71b700f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "programFinancialServiceProviderConfigurationPropertyUnique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "programFinancialServiceProviderConfigurationUnique"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_fsp_configuration_property_id_seq" OWNED BY "121-service"."program_fsp_configuration_property"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_fsp_configuration_property_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "FK_23260bdde9cee10304192140b77"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_fsp_configuration_id_seq" OWNED BY "121-service"."program_fsp_configuration"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_fsp_configuration_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "FK_23260bdde9cee10304192140b77" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    /////////////////////////////////////////////
    // This is the thirs auto-generated migration, to add missing stuff and give stuff the correct names.
    ////////////////////////////////////////////
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_fsp_configuration_property_id_seq" OWNED BY "121-service"."program_fsp_configuration_property"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_fsp_configuration_property_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_fff8ff586a03d469256098b8f86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" DROP CONSTRAINT "FK_23260bdde9cee10304192140b77"`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_fsp_configuration_id_seq" OWNED BY "121-service"."program_fsp_configuration"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_fsp_configuration_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration_property" ADD CONSTRAINT "FK_23260bdde9cee10304192140b77" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_c5eb02b5f6a4b4269d0a19b49f2" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_fff8ff586a03d469256098b8f86" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    ///////////////////////////////////////////////
    // Replace 'FinancialServiceProvider' with 'Fsp' in the specified columns
    ///////////////////////////////////////////////
    await this.replaceFinancialServiceProviderInColumn(
      queryRunner,
      'event',
      'type',
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // We agreed not to implement the down migration for these kind of database migrations
  }

  public async replaceFinancialServiceProviderInColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    schema = '121-service',
  ): Promise<void> {
    const capitalQuery = `
    UPDATE "${schema}"."${tableName}"
    SET "${columnName}" = REPLACE("${columnName}", 'FinancialServiceProvider', 'Fsp')
    WHERE "${columnName}" LIKE '%FinancialServiceProvider%';
  `;
    const nonCapitalQuery = `
    UPDATE "${schema}"."${tableName}"
    SET "${columnName}" = REPLACE("${columnName}", 'financialServiceProvider', 'fsp')
    WHERE "${columnName}" LIKE '%financialServiceProvider%';
  `;

    await queryRunner.query(capitalQuery);
    await queryRunner.query(nonCapitalQuery);

    // await this.logFinancialServiceProviderOccurrences(queryRunner);
  }

  // This was used on NLRC dump to find all occurrences of 'financialServiceProvider' in cells in the database
  // and log them to the console. Now commented out to avoid performance issues
  // We only found occurrences in the event.type column
  public async logFinancialServiceProviderOccurrences(
    queryRunner: QueryRunner,
    schema = '121-service',
    searchString = 'financialserviceprovider',
  ): Promise<void> {
    // Find all columns of type character varying or text in the schema
    const columns: { table_name: string; column_name: string }[] =
      await queryRunner.query(
        `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = $1
        AND data_type IN ('character varying', 'text')
      `,
        [schema],
      );

    for (const { table_name, column_name } of columns) {
      // Search for the string in each column
      const result: Record<string, unknown>[] = await queryRunner.query(
        `
      SELECT "${column_name}" AS value, COUNT(*) AS count
      FROM "${schema}"."${table_name}"
      WHERE "${column_name}" ILIKE $1
      GROUP BY "${column_name}"
      HAVING "${column_name}" ILIKE $1
      `,
        [`%${searchString}%`],
      );

      if (result.length > 0) {
        console.log(
          `[Migration] Found '${searchString}' in "${schema}"."${table_name}"."${column_name}":`,
        );
        for (const row of result) {
          console.log(`  Value: ${row.value}, Count: ${row.count}`);
        }
      }
    }
  }
}
