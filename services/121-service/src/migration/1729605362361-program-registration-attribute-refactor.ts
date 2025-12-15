import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramRegistrationAttributeRefactor1729605362361 implements MigrationInterface {
  name = 'ProgramRegistrationAttributeRefactor1729605362361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // console.time('Migration');
    await this.createNewTablesAndViews(queryRunner);

    await this.migrateFspConig(queryRunner);
    await this.migrateQuestionsToProgramRegistrationAttributes(queryRunner);
    await this.addConstraints(queryRunner);

    await this.checkRegistrationFspConfigMigrations(queryRunner);
    await this.checkTransactionFspConfigMigrations(queryRunner);

    await this.adjustPermissions(queryRunner);

    await this.dropOldTablesAndViews(queryRunner);
    // console.timeEnd('Migration');
    // throw new Error('You shall not pass! Use this to prevent the migration from passing');
  }
  private async createNewTablesAndViews(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_ba98ea5ca43ebe54f60c5aaabe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD COLUMN "programFinancialServiceProviderConfigurationId" INTEGER`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD COLUMN "programFinancialServiceProviderConfigurationId" INTEGER`,
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
      `CREATE TABLE "121-service"."program_registration_attribute" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "label" json NOT NULL, "type" character varying NOT NULL, "isRequired" boolean NOT NULL, "placeholder" json, "options" json, "scoring" json NOT NULL DEFAULT '{}', "programId" integer NOT NULL, "export" json NOT NULL DEFAULT '["all-people-affected","included"]', "pattern" character varying, "duplicateCheck" boolean NOT NULL DEFAULT false, "showInPeopleAffectedTable" boolean NOT NULL DEFAULT false, "editableInPortal" boolean NOT NULL DEFAULT false, CONSTRAINT "programAttributeUnique" UNIQUE ("name", "programId"), CONSTRAINT "CHK_88f5ede846c87b3059ed09f967" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'registeredDate', 'validationDate', 'inclusionDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate')), CONSTRAINT "PK_b85642d2f95cc2fcc6145e14463" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1387f030d9f04f7d80c78a60d5" ON "121-service"."program_registration_attribute" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."registration_attribute_data" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "registrationId" integer NOT NULL, "programRegistrationAttributeId" integer NOT NULL, "value" character varying NOT NULL, CONSTRAINT "registrationProgramAttributeUnique" UNIQUE ("registrationId", "programRegistrationAttributeId"), CONSTRAINT "PK_bef7662581d64d69db3f6405411" PRIMARY KEY ("id"))`,
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
      `CREATE INDEX "IDX_d8a56a1864ef40e1551833430b" ON "121-service"."transaction" ("programFinancialServiceProviderConfigurationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" ADD CONSTRAINT "FK_5e40569627925419cd94db0da36" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_f7400125e09c4d8fec5747ec588" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD CONSTRAINT "FK_8788ebf12909c03049a0d8c377d" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d8a56a1864ef40e1551833430bb" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ['VIEW', 'registration_view', '121-service'],
    );
    await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
    await queryRunner.query(
      `CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFinancialServiceProviderConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );

    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFinancialServiceProviderConfigurationLabel", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", fspconfig."name" AS "programFinancialServiceProviderConfigurationName", fspconfig."id" AS "programFinancialServiceProviderConfigurationId", fspconfig."financialServiceProviderName" AS "financialServiceProviderName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_financial_service_provider_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFinancialServiceProviderConfigurationId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );
  }

  private async adjustPermissions(queryRunner: QueryRunner) {
    // Step 1: Select the IDs of the permissions to be deleted
    const permissionIds = await queryRunner.query(`
      SELECT id FROM "121-service".permission WHERE "name" IN ('program:question.update', 'program:question.delete', 'program:custom-attribute.update')
    `);

    if (permissionIds.length > 0) {
      const ids = permissionIds
        .map((permission: { id: number }) => permission.id)
        .join(',');

      // Step 2: Delete entries from user_role_permissions_permission table
      await queryRunner.query(`
        DELETE FROM "121-service".user_role_permissions_permission WHERE "permissionId" IN (${ids})
      `);

      // Step 3: Delete the permissions from the permission table
      await queryRunner.query(`
        DELETE FROM "121-service".permission WHERE "id" IN (${ids})
      `);
    }

    // Step 4: Rename the permission 'registration:fsp.update' to 'registration:fsp-config.update'
    await queryRunner.query(`
      UPDATE "121-service".permission
      SET "name" = 'registration:fsp-config.update'
      WHERE "name" = 'registration:fsp.update'
    `);
  }

  private async migrateFspConig(queryRunner: QueryRunner) {
    const programFspAssignements = await queryRunner.query(`
      SELECT
        pfspfsp."programId",
        pfspfsp."financialServiceProviderId",
        fsp.fsp  AS "financialServiceProviderName",
        fsp.id AS "financialServiceProviderId",
        fsp."displayName" AS "financialServiceProviderNameDisplayName"
      FROM
        "121-service".program_financial_service_providers_financial_service_provider AS pfspfsp
      LEFT JOIN
        "121-service".financial_service_provider AS fsp
      ON
        pfspfsp."financialServiceProviderId" = fsp.id`);
    for (const assignemt of programFspAssignements) {
      const oldFspConfigDisplayName = await this.getOldFspConfigDisplayName(
        queryRunner,
        assignemt.programId,
        assignemt.financialServiceProviderId,
      );
      // write some code to migrate displays names from the old fsp config setup
      const newFspConfig = {
        created: new Date(),
        updated: new Date(),
        programId: assignemt.programId,
        financialServiceProviderName: assignemt.financialServiceProviderName,
        name: assignemt.financialServiceProviderName,
        label:
          oldFspConfigDisplayName ??
          JSON.stringify({ en: assignemt.financialServiceProviderName }),
      };
      // raw query insert
      const insterFspConfigResult = await queryRunner.query(`
          INSERT INTO "121-service".program_financial_service_provider_configuration (
            created,
            updated,
            "programId",
            "financialServiceProviderName",
            name,
            label
          )
          VALUES (
            now(),
            now(),
            ${newFspConfig.programId},
            '${newFspConfig.financialServiceProviderName}',
            '${newFspConfig.name}',
            '${newFspConfig.label}'
          )
          RETURNING id
    `);

      const insertedId = insterFspConfigResult[0].id;

      // Update the transaction table so transactions are related to program_financial_service_provider_configuration instead of fspId
      await queryRunner.query(`
          UPDATE "121-service".transaction
          SET "programFinancialServiceProviderConfigurationId" = ${insertedId}
          WHERE "programId" = ${assignemt.programId}
          AND "financialServiceProviderId" = ${assignemt.financialServiceProviderId}`);
      // do the same per registration
      await queryRunner.query(`
          UPDATE "121-service".registration
          SET "programFinancialServiceProviderConfigurationId" = ${insertedId}
          WHERE "programId" = ${assignemt.programId}
          AND "fspId" = ${assignemt.financialServiceProviderId}`);
      // migrate old fsp config properties to the new fsp config properties
      await this.migrateOldFspConfigToFspConfigProperties(
        queryRunner,
        insertedId,
        assignemt.programId,
        assignemt.financialServiceProviderId,
      );
    }

    // migrate transactions to relate to the new fsp config instead of fsp
  }

  private async migrateOldFspConfigToFspConfigProperties(
    queryRunner: QueryRunner,
    newFspConfigId: number,
    programId: number,
    fspId: number,
  ): Promise<void> {
    const oldFspConfig = await queryRunner.query(`
      SELECT
        *
      FROM
        "121-service".program_fsp_configuration
      WHERE
        "fspId" = ${fspId}
      AND
        "programId" = ${programId}
      AND name != 'displayName'`);

    for (const config of oldFspConfig) {
      // insert the old fsp config in the new table
      await queryRunner.query(`
        INSERT INTO "121-service".program_financial_service_provider_configuration_property (
          name,
          value,
          "programFinancialServiceProviderConfigurationId"
        )
        VALUES (
          '${config.name}',
          '${config.value}',
          ${newFspConfigId}
        )`);
    }
  }

  private async getOldFspConfigDisplayName(
    queryRunner: QueryRunner,
    programId: number,
    fspId: number,
  ): Promise<string | undefined> {
    const oldFspConfig = await queryRunner.query(`
    SELECT
      *
    FROM
      "121-service".program_fsp_configuration
    WHERE
      "fspId" = ${fspId}
    AND
      "programId" = ${programId}
    AND
      "name" = 'displayName'`);
    return oldFspConfig[0]?.value;

    // get the display name from the old fsp config
  }

  private async migrateQuestionsToProgramRegistrationAttributes(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
    INSERT INTO "121-service".program_registration_attribute (
      created,
      updated,
      name,
      label,
      type,
      "isRequired",
      placeholder,
      options,
      scoring,
      "programId",
      export,
      pattern,
      "duplicateCheck",
      "showInPeopleAffectedTable",
      "editableInPortal"
    )
    SELECT
      created,
      updated,
      name,
      label,
      type,
      false AS "isRequired",  -- Set a default value as it's not present in the old table
      NULL::json AS placeholder,  -- Set to NULL as it's not present in the old table
      NULL::json AS options,  -- Set to NULL as it's not present in the old table
      '{}'::json AS scoring,  -- Set default empty JSON as specified in the new table
      "programId",
      '["all-people-affected","included"]'::json AS export,  -- Default value as specified in the new table
      NULL::character varying AS pattern,  -- Set to NULL as it's not present in the old table
      "duplicateCheck",
      "showInPeopleAffectedTable",
      true AS "editableInPortal"  -- Set as true value as it's not present in the old table
    FROM
      "121-service".program_custom_attribute`);

    await queryRunner.query(`
      INSERT INTO "121-service".program_registration_attribute (
        created,
        updated,
        name,
        label,
        type,
        "isRequired",
        placeholder,
        options,
        scoring,
        "programId",
        export,
        pattern,
        "duplicateCheck",
        "showInPeopleAffectedTable",
        "editableInPortal"
      )
      SELECT
        created,
        updated,
        name,
        label,
        "answerType" as type,
        false AS "isRequired",
        placeholder,
        options,
        scoring,
        "programId",
        export,
        pattern,
        "duplicateCheck",
        "showInPeopleAffectedTable",
        "editableInPortal"
      FROM
        "121-service".program_question
    `);

    await queryRunner.query(`
      INSERT INTO "121-service".program_registration_attribute (
        created,
        updated,
        name,
        label,
        type,
        "isRequired",
        placeholder,
        options,
        scoring,
        "programId",
        export,
        pattern,
        "duplicateCheck",
        "showInPeopleAffectedTable",
        "editableInPortal"
      )
      SELECT
        fspq.created,
        fspq.updated,
        fspq.name,
        fspq.label,
        fspq."answerType",
        false AS "isRequired", -- Set a default value as it's not present in the old table
        fspq.placeholder,
        fspq.options,
        '{}'::json AS scoring, -- Set default empty JSON as specified in the new table
        pfsp."programId",
        fspq.export,
        fspq.pattern,
        fspq."duplicateCheck",
        fspq."showInPeopleAffectedTable",
        false AS "editableInPortal" -- Set a default value as it's not present in the old table
      FROM
        "121-service".financial_service_provider_question fspq
      JOIN
        "121-service".program_financial_service_providers_financial_service_provider pfsp
      ON
        fspq."fspId" = pfsp."financialServiceProviderId"
      ON
        CONFLICT (name, "programId") DO NOTHING;`);

    const [
      programRegistrationAttributes,
      programQuestions,
      programCustomAttributes,
      fspQuestions,
    ] = await Promise.all([
      queryRunner.query(
        `SELECT id, name, "programId" FROM "121-service".program_registration_attribute`,
      ),
      queryRunner.query(
        `SELECT id, name, "programId" FROM "121-service".program_question`,
      ),
      queryRunner.query(
        `SELECT id, name, "programId" FROM "121-service".program_custom_attribute`,
      ),
      queryRunner.query(
        `SELECT id, name FROM "121-service".financial_service_provider_question`,
      ),
    ]);
    for (const programRegistrationAttribute of programRegistrationAttributes) {
      const matchingProgramQuestion = programQuestions.find(
        (pq) =>
          pq.name === programRegistrationAttribute.name &&
          pq.programId === programRegistrationAttribute.programId,
      );
      if (matchingProgramQuestion) {
        const queryPQData = `
          INSERT INTO "121-service".registration_attribute_data (
            created,
            updated,
            "registrationId",
            "programRegistrationAttributeId",
            value
          )
          SELECT
            rd.created,
            rd.updated,
            rd."registrationId",
            ${programRegistrationAttribute.id},
            rd.value
          FROM
            "121-service".registration_data rd
          WHERE
            rd."programQuestionId" = ${matchingProgramQuestion.id}`;
        await queryRunner.query(queryPQData);
      }
    }

    for (const programRegistrationAttribute of programRegistrationAttributes) {
      const matchingProgramCustomAttribute = programCustomAttributes.find(
        (pca) =>
          pca.name === programRegistrationAttribute.name &&
          pca.programId === programRegistrationAttribute.programId,
      );
      if (matchingProgramCustomAttribute) {
        const queryPQData = `
          INSERT INTO "121-service".registration_attribute_data (
            created,
            updated,
            "registrationId",
            "programRegistrationAttributeId",
            value
          )
          SELECT
            rd.created,
            rd.updated,
            rd."registrationId",
            ${programRegistrationAttribute.id},
            rd.value
          FROM
            "121-service".registration_data rd
          WHERE
            rd."programCustomAttributeId" = ${matchingProgramCustomAttribute.id}`;
        await queryRunner.query(queryPQData);
      }
    }

    for (const programRegistrationAttribute of programRegistrationAttributes) {
      const matchingFspQs = fspQuestions.filter(
        (fspQ) => fspQ.name === programRegistrationAttribute.name,
      );

      if (matchingFspQs.length > 0) {
        const fspQuestionIds = matchingFspQs.map((fspQ) => fspQ.id).join(', ');
        // Remove registration data related to unmatched fsp questions
        // So for example some registrations still have data of jumbo while their fsp is now visa
        const deleteRegistrationDataRelatedToUnMatchedFsp = `
          DELETE FROM "121-service".registration_data rd
          USING "121-service".registration r, "121-service"."financial_service_provider_question" fq
          WHERE rd."registrationId" = r.id
            AND rd."fspQuestionId" = fq.id
            AND fq."fspId" != r."fspId";
      `;
        await queryRunner.query(deleteRegistrationDataRelatedToUnMatchedFsp);

        const queryFQData = `
          INSERT INTO "121-service".registration_attribute_data (
            created,
            updated,
            "registrationId",
            "programRegistrationAttributeId",
            value
          )
          SELECT
            rd.created,
            rd.updated,
            rd."registrationId",
            ${programRegistrationAttribute.id},
            rd.value
          FROM
            "121-service".registration_data rd
            LEFT JOIN
            "121-service".registration r ON r.id = rd."registrationId"
          WHERE
            rd."fspQuestionId" IN (${fspQuestionIds}) AND r."programId" = ${programRegistrationAttribute.programId}`;

        await queryRunner.query(queryFQData);
      }
    }

    return Promise.resolve();
  }

  private async checkRegistrationFspConfigMigrations(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // check if all the fsp config properties have been migrated
    const mismatchedRegistrations = await queryRunner.query(`
    SELECT r.*
      FROM "121-service".registration r
      LEFT JOIN "121-service".program_financial_service_provider_configuration fspConfig
        ON r."programFinancialServiceProviderConfigurationId" = fspConfig.id
      WHERE r."programId" != fspConfig."programId"
  `);

    if (mismatchedRegistrations.length > 0) {
      throw new Error(
        `Data integrity issue: ${mismatchedRegistrations.length} registrations are linked to an FSP configuration with a different programId.`,
      );
    }
  }

  private async checkTransactionFspConfigMigrations(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // check if all the fsp config properties have been migrated
    const mismatchedTransactions = await queryRunner.query(`
        SELECT t.*
        FROM "121-service".transaction t
        LEFT JOIN "121-service".program_financial_service_provider_configuration fspConfig
          ON t."programFinancialServiceProviderConfigurationId" = fspConfig.id
        WHERE t."programId" != fspConfig."programId"
    `);

    if (mismatchedTransactions.length > 0) {
      throw new Error(
        `Data integrity issue: ${mismatchedTransactions.length} transactions are linked to an FSP configuration with a different programId.`,
      );
    }
  }

  private async addConstraints(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "121-service"."program_financial_service_pro_id_seq" OWNED BY "121-service"."program_financial_service_provider_configuration_property"."id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" ALTER COLUMN "id" SET DEFAULT nextval('"121-service"."program_financial_service_pro_id_seq"')`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_provider_configuration_property" ALTER COLUMN "id" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_d8a56a1864ef40e1551833430bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ALTER COLUMN "programFinancialServiceProviderConfigurationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_d8a56a1864ef40e1551833430bb" FOREIGN KEY ("programFinancialServiceProviderConfigurationId") REFERENCES "121-service"."program_financial_service_provider_configuration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "programFinancialServiceProviderConfigurationId" SET NOT NULL`,
    );
  }

  private async dropOldTablesAndViews(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE "121-service"."registration_data" cascade`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP COLUMN "financialServiceProviderId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP COLUMN "fspId"`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_fsp_configuration" cascade`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_custom_attribute" cascade`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_question" cascade`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."financial_service_provider_question" cascade`,
    );
    await queryRunner.query(
      `DROP TABLE "121-service"."program_financial_service_providers_financial_service_provider" cascade`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('Not implemented');
  }
}
