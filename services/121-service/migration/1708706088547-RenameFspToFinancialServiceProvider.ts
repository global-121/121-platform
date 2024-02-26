import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameFspToFinancialServiceProvider1708706088547 implements MigrationInterface {
    name = 'RenameFspToFinancialServiceProvider1708706088547'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // No dropping of indexes needed (hopefully).
        // According to Co-Pilot PostgreSQL does a pretty good job managing indexes when changing/renaming tables and columns, except when the data type of a column changes. So leaving it for now.

        // Drop FK constraint
        // What TypeORM generated:
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2"`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`);

        // TODO: Drop UNIQUE constraints?

        // Renaming tables
        await queryRunner.query(`ALTER TABLE "121-service"."fsp" RENAME TO "financial_service_provider"`);
        await queryRunner.query(`ALTER TABLE "121-service"."fsp_attribute" RENAME TO "financial_service_provider_attribute"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_fsp_configuration" RENAME TO "program_financial_service_provider_configuration"`);
        // Also renaming the cross table that TypeORM generated for n to m relationship between program and fsp
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_fsp" RENAME TO "program_financial_service_providers_financial_service_provider"`);

        // Renaming columns
        await queryRunner.query(`ALTER TABLE "121-service"."financial_service_provider" RENAME COLUMN "fsp" TO "name"`);
        await queryRunner.query(`ALTER TABLE "121-service"."financial_service_provider" RENAME COLUMN "fspDisplayNamePortal" TO "displayNamePortal"`);
        await queryRunner.query(`ALTER TABLE "121-service"."financial_service_provider" RENAME COLUMN "fspDisplayNamePaApp" TO "displayNamePaApp"`);
        await queryRunner.query(`ALTER TABLE "121-service"."financial_service_provider_attribute" RENAME COLUMN "fspId" TO "financialServiceProviderId"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" RENAME COLUMN "fspId" TO "financialServiceProviderId"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" RENAME COLUMN "fspQuestionId" TO "financialServiceProviderAttributeId"`);
        // Skipping transaction, since that already has a column named financialServiceProviderId.
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_provider_configuration" RENAME COLUMN "fspId" TO "financialServiceProviderId"`);
        // This is the "cross table" that TypeORM generated for n to m relationship between program and fsp.
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" RENAME COLUMN "fspId" TO "financialServiceProviderId"`);

        // Create FK constraints
        // What TypeORM generated:
        await queryRunner.query(`ALTER TABLE "121-service"."financial_service_provider_attribute" ADD CONSTRAINT "FK_c7ab0cfb456730beb97a573f812" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2" FOREIGN KEY ("financialServiceProviderAttributeId") REFERENCES "121-service"."financial_service_provider_attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_f7400125e09c4d8fec5747ec588" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_0d40d0c27aaa89c51f5a2e5b95e" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" ADD CONSTRAINT "FK_9963d8ef06f3358d2bc7fa6a4dd" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" ADD CONSTRAINT "FK_789ae7926495e63ba39ef47b8c2" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // TODO: Create UNIQUE constraints?

        // TODO: Renaming things in the registration_view

        // TODO: When all done, auto generate migrate script after running the migration to see that no changes are left that went unnoticed.


        /* Below is what TypeORM generated, which seems to be largely incorrect.

        // TODO: Does it need to drop the view? Can it be updated instead?
        await queryRunner.query(`DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","registration_view","121-service"]);
        await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
        // TODO: Does it need to drop these contraints? Is that required when renaming a table or columns?
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2"`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`);
        // TODO: Creating new tables does not seem right. It needs to update existing tables and columns to rename.
        await queryRunner.query(`CREATE TABLE "121-service"."financial_service_provider_attribute_entity" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "label" json NOT NULL, "placeholder" json, "options" json, "export" json NOT NULL DEFAULT '["all-people-affected","included"]', "answerType" character varying NOT NULL, "duplicateCheck" boolean NOT NULL DEFAULT false, "phases" json NOT NULL DEFAULT '[]', "fspId" integer NOT NULL, "shortLabel" json, CONSTRAINT "financialServiceProviderAttributeUnique" UNIQUE ("name", "fspId"), CONSTRAINT "CHK_5c3044f093405b656a8aab8a5f" CHECK ("name" NOT IN ('id', 'status', 'referenceId', 'preferredLanguage', 'inclusionScore', 'paymentAmountMultiplier', 'financialServiceProvider', 'registrationProgramId', 'maxPayments', 'lastTransactionCreated', 'lastTransactionPaymentNumber', 'lastTransactionStatus', 'lastTransactionAmount', 'lastTransactionErrorMessage', 'lastTransactionCustomData', 'paymentCount', 'paymentCountRemaining', 'importedDate', 'invitedDate', 'startedRegistrationDate', 'registeredWhileNoLongerEligibleDate', 'registeredDate', 'rejectionDate', 'noLongerEligibleDate', 'validationDate', 'inclusionDate', 'inclusionEndDate', 'deleteDate', 'completedDate', 'lastMessageStatus', 'lastMessageType', 'declinedDate')), CONSTRAINT "PK_548064b499aacf2f68c8a10ade6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ac1f34f5055a3da31388aacaa0" ON "121-service"."financial_service_provider_attribute_entity" ("created") `);
        await queryRunner.query(`CREATE TABLE "121-service"."program_financial_service_provider_configuration" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "financialServiceProviderId" integer NOT NULL, "name" character varying NOT NULL, "value" character varying NOT NULL, CONSTRAINT "programFinancialServiceProviderConfigurationUnique" UNIQUE ("programId", "financialServiceProviderId", "name"), CONSTRAINT "PK_bc2d4d99fa94cb01d4566acdffc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_04aac36fce58b33d30d71b700f" ON "121-service"."program_financial_service_provider_configuration" ("created") `);
        await queryRunner.query(`CREATE TABLE "121-service"."financial_service_provider" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "displayNamePaApp" json, "displayNamePortal" character varying, "integrationType" character varying NOT NULL DEFAULT 'api', "hasReconciliation" boolean NOT NULL DEFAULT false, "notifyOnTransaction" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_ff8f719b1da33ee6953b16409d3" UNIQUE ("name"), CONSTRAINT "PK_af433cae58e5eb3e53a45e4ee9c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a0f41ec6505ba4bd1c8e99c6e5" ON "121-service"."financial_service_provider" ("created") `);
        await queryRunner.query(`CREATE TABLE "121-service"."program_financial_service_providers_financial_service_provider" ("programId" integer NOT NULL, "financialServiceProviderId" integer NOT NULL, CONSTRAINT "PK_82446e48faf54f2fb2e870f3566" PRIMARY KEY ("programId", "financialServiceProviderId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9963d8ef06f3358d2bc7fa6a4d" ON "121-service"."program_financial_service_providers_financial_service_provider" ("programId") `);
        await queryRunner.query(`CREATE INDEX "IDX_789ae7926495e63ba39ef47b8c" ON "121-service"."program_financial_service_providers_financial_service_provider" ("financialServiceProviderId") `);
        // TODO: Does it need to add these FK constraints? Maybe it is because of creating the tables above. Unless dropping FK contraints is required for renaming.
        await queryRunner.query(`ALTER TABLE "121-service"."financial_service_provider_attribute_entity" ADD CONSTRAINT "FK_c7ab0cfb456730beb97a573f812" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2" FOREIGN KEY ("fspQuestionId") REFERENCES "121-service"."financial_service_provider_attribute_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_f7400125e09c4d8fec5747ec588" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_provider_configuration" ADD CONSTRAINT "FK_0d40d0c27aaa89c51f5a2e5b95e" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" ADD CONSTRAINT "FK_9963d8ef06f3358d2bc7fa6a4dd" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" ADD CONSTRAINT "FK_789ae7926495e63ba39ef47b8c2" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // TODO: Here it creates the view again. Is that required? Or can the existing view be updated?
        await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."name" AS "financialServiceProvider", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", fsp.nameDisplayNamePortal AS "fspDisplayNamePortal", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`);
        await queryRunner.query(`INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["121-service","VIEW","registration_view","SELECT \"registration\".\"id\" AS \"id\", \"registration\".\"created\" AS \"registrationCreated\", \"registration\".\"programId\" AS \"programId\", \"registration\".\"registrationStatus\" AS \"status\", \"registration\".\"referenceId\" AS \"referenceId\", \"registration\".\"phoneNumber\" AS \"phoneNumber\", \"registration\".\"preferredLanguage\" AS \"preferredLanguage\", \"registration\".\"inclusionScore\" AS \"inclusionScore\", \"registration\".\"paymentAmountMultiplier\" AS \"paymentAmountMultiplier\", \"registration\".\"maxPayments\" AS \"maxPayments\", \"registration\".\"paymentCount\" AS \"paymentCount\", \"registration\".\"scope\" AS \"scope\", \"fsp\".\"name\" AS \"financialServiceProvider\", CAST(CONCAT('PA #',registration.\"registrationProgramId\") as VARCHAR) AS \"personAffectedSequence\", registration.\"registrationProgramId\" AS \"registrationProgramId\", TO_CHAR(\"registration\".\"created\",'yyyy-mm-dd') AS \"registrationCreatedDate\", fsp.nameDisplayNamePortal AS \"fspDisplayNamePortal\", \"registration\".\"maxPayments\" - \"registration\".\"paymentCount\" AS \"paymentCountRemaining\", COALESCE(\"message\".\"type\" || ': ' || \"message\".\"status\",'no messages yet') AS \"lastMessageStatus\" FROM \"121-service\".\"registration\" \"registration\" LEFT JOIN \"121-service\".\"financial_service_provider\" \"fsp\" ON \"fsp\".\"id\"=\"registration\".\"fspId\"  LEFT JOIN \"121-service\".\"latest_message\" \"latestMessage\" ON \"latestMessage\".\"registrationId\"=\"registration\".\"id\"  LEFT JOIN \"121-service\".\"twilio_message\" \"message\" ON \"message\".\"id\"=\"latestMessage\".\"messageId\" ORDER BY \"registration\".\"registrationProgramId\" ASC"]);

        */
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","registration_view","121-service"]);
        await queryRunner.query(`DROP VIEW "121-service"."registration_view"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" DROP CONSTRAINT "FK_789ae7926495e63ba39ef47b8c2"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" DROP CONSTRAINT "FK_9963d8ef06f3358d2bc7fa6a4dd"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_provider_configuration" DROP CONSTRAINT "FK_0d40d0c27aaa89c51f5a2e5b95e"`);
        await queryRunner.query(`ALTER TABLE "121-service"."program_financial_service_provider_configuration" DROP CONSTRAINT "FK_f7400125e09c4d8fec5747ec588"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" DROP CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2"`);
        await queryRunner.query(`ALTER TABLE "121-service"."financial_service_provider_attribute_entity" DROP CONSTRAINT "FK_c7ab0cfb456730beb97a573f812"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_789ae7926495e63ba39ef47b8c"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_9963d8ef06f3358d2bc7fa6a4d"`);
        await queryRunner.query(`DROP TABLE "121-service"."program_financial_service_providers_financial_service_provider"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_a0f41ec6505ba4bd1c8e99c6e5"`);
        await queryRunner.query(`DROP TABLE "121-service"."financial_service_provider"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_04aac36fce58b33d30d71b700f"`);
        await queryRunner.query(`DROP TABLE "121-service"."program_financial_service_provider_configuration"`);
        await queryRunner.query(`DROP INDEX "121-service"."IDX_ac1f34f5055a3da31388aacaa0"`);
        await queryRunner.query(`DROP TABLE "121-service"."financial_service_provider_attribute_entity"`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."fsp"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "121-service"."registration_data" ADD CONSTRAINT "FK_58b2a3b937d3b3dbf30c4d328b2" FOREIGN KEY ("fspQuestionId") REFERENCES "121-service"."fsp_attribute"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."fsp" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`);
        await queryRunner.query(`INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["121-service","VIEW","registration_view","SELECT \"registration\".\"id\" AS \"id\", \"registration\".\"created\" AS \"registrationCreated\", \"registration\".\"programId\" AS \"programId\", \"registration\".\"registrationStatus\" AS \"status\", \"registration\".\"referenceId\" AS \"referenceId\", \"registration\".\"phoneNumber\" AS \"phoneNumber\", \"registration\".\"preferredLanguage\" AS \"preferredLanguage\", \"registration\".\"inclusionScore\" AS \"inclusionScore\", \"registration\".\"paymentAmountMultiplier\" AS \"paymentAmountMultiplier\", \"registration\".\"maxPayments\" AS \"maxPayments\", \"registration\".\"paymentCount\" AS \"paymentCount\", \"registration\".\"scope\" AS \"scope\", \"fsp\".\"fsp\" AS \"financialServiceProvider\", \"fsp\".\"fspDisplayNamePortal\" AS \"fspDisplayNamePortal\", CAST(CONCAT('PA #',registration.\"registrationProgramId\") as VARCHAR) AS \"personAffectedSequence\", registration.\"registrationProgramId\" AS \"registrationProgramId\", TO_CHAR(\"registration\".\"created\",'yyyy-mm-dd') AS \"registrationCreatedDate\", \"registration\".\"maxPayments\" - \"registration\".\"paymentCount\" AS \"paymentCountRemaining\", COALESCE(\"message\".\"type\" || ': ' || \"message\".\"status\",'no messages yet') AS \"lastMessageStatus\" FROM \"121-service\".\"registration\" \"registration\" LEFT JOIN \"121-service\".\"fsp\" \"fsp\" ON \"fsp\".\"id\"=\"registration\".\"fspId\"  LEFT JOIN \"121-service\".\"latest_message\" \"latestMessage\" ON \"latestMessage\".\"registrationId\"=\"registration\".\"id\"  LEFT JOIN \"121-service\".\"twilio_message\" \"message\" ON \"message\".\"id\"=\"latestMessage\".\"messageId\" ORDER BY \"registration\".\"registrationProgramId\" ASC"]);
    }

}
