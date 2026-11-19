import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyNumericColumns1794325752557 implements MigrationInterface {
  name = 'AddCurrencyNumericColumns1794325752557';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addNumericColumns({ queryRunner });
    await this.backfillNumericColumnsFromLegacy({ queryRunner });
    await this.createProgramCurrencySyncTriggers({ queryRunner });
    await this.createTransactionCurrencySyncTriggers({ queryRunner });
    await this.recreateCurrencyViews({ queryRunner });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropCurrencySyncTriggers({ queryRunner });
    await this.backfillLegacyColumnsFromNumeric({ queryRunner });
    await this.recreateCurrencyViews({
      queryRunner,
      useLegacyColumns: true,
    });
    await this.dropNumericColumns({ queryRunner });
  }

  private async addNumericColumns({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "121-service"."program"
        ADD COLUMN "fixedTransferValueNumeric" numeric,
        ADD COLUMN "budgetNumeric" numeric
    `);
    await queryRunner.query(`
      ALTER TABLE "121-service"."transaction"
        ADD COLUMN "transferValueNumeric" numeric
    `);
  }

  private async dropNumericColumns({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "121-service"."transaction"
        DROP COLUMN "transferValueNumeric"
    `);
    await queryRunner.query(`
      ALTER TABLE "121-service"."program"
        DROP COLUMN "fixedTransferValueNumeric",
        DROP COLUMN "budgetNumeric"
    `);
  }

  private async backfillNumericColumnsFromLegacy({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      UPDATE "121-service"."program"
      SET "fixedTransferValueNumeric" = "fixedTransferValue"::text::numeric,
          "budgetNumeric" = "budget"::numeric
    `);
    await queryRunner.query(`
      UPDATE "121-service"."transaction"
      SET "transferValueNumeric" = "transferValue"::text::numeric
    `);
  }

  private async backfillLegacyColumnsFromNumeric({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      UPDATE "121-service"."program"
      SET "fixedTransferValue" = "fixedTransferValueNumeric"::real,
          "budget" = "budgetNumeric"::integer
    `);
    await queryRunner.query(`
      UPDATE "121-service"."transaction"
      SET "transferValue" = "transferValueNumeric"::real
    `);
  }

  private async createProgramCurrencySyncTriggers({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "121-service"."sync_program_currency_columns"()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW."fixedTransferValueNumeric" IS NULL THEN
            NEW."fixedTransferValueNumeric" := NEW."fixedTransferValue"::text::numeric;
          ELSE
            NEW."fixedTransferValue" := NEW."fixedTransferValueNumeric"::real;
          END IF;

          IF NEW."budgetNumeric" IS NULL THEN
            NEW."budgetNumeric" := NEW."budget"::numeric;
          ELSE
            PERFORM "121-service"."validate_legacy_budget"(NEW."budgetNumeric");
            NEW."budget" := NEW."budgetNumeric"::integer;
          END IF;
        ELSE
          IF NEW."fixedTransferValueNumeric" IS DISTINCT FROM OLD."fixedTransferValueNumeric" THEN
            NEW."fixedTransferValue" := NEW."fixedTransferValueNumeric"::real;
          ELSIF NEW."fixedTransferValue" IS DISTINCT FROM OLD."fixedTransferValue" THEN
            NEW."fixedTransferValueNumeric" := NEW."fixedTransferValue"::text::numeric;
          END IF;

          IF NEW."budgetNumeric" IS DISTINCT FROM OLD."budgetNumeric" THEN
            PERFORM "121-service"."validate_legacy_budget"(NEW."budgetNumeric");
            NEW."budget" := NEW."budgetNumeric"::integer;
          ELSIF NEW."budget" IS DISTINCT FROM OLD."budget" THEN
            NEW."budgetNumeric" := NEW."budget"::numeric;
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "121-service"."validate_legacy_budget"(budget_value numeric)
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF budget_value IS NOT NULL AND (
          budget_value <> trunc(budget_value)
          OR budget_value < -2147483648
          OR budget_value > 2147483647
        ) THEN
          RAISE EXCEPTION 'Budget must be a whole number within the legacy integer range during the compatibility period';
        END IF;
      END;
      $$
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TR_program_currency_shadow_insert"
      BEFORE INSERT ON "121-service"."program"
      FOR EACH ROW EXECUTE FUNCTION "121-service"."sync_program_currency_columns"()
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TR_program_currency_shadow_update"
      BEFORE UPDATE OF "fixedTransferValue", "fixedTransferValueNumeric", "budget", "budgetNumeric"
      ON "121-service"."program"
      FOR EACH ROW EXECUTE FUNCTION "121-service"."sync_program_currency_columns"()
    `);
  }

  private async createTransactionCurrencySyncTriggers({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "121-service"."sync_transaction_currency_columns"()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          IF NEW."transferValueNumeric" IS NULL THEN
            NEW."transferValueNumeric" := NEW."transferValue"::text::numeric;
          ELSE
            NEW."transferValue" := NEW."transferValueNumeric"::real;
          END IF;
        ELSIF NEW."transferValueNumeric" IS DISTINCT FROM OLD."transferValueNumeric" THEN
          NEW."transferValue" := NEW."transferValueNumeric"::real;
        ELSIF NEW."transferValue" IS DISTINCT FROM OLD."transferValue" THEN
          NEW."transferValueNumeric" := NEW."transferValue"::text::numeric;
        END IF;

        RETURN NEW;
      END;
      $$
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TR_transaction_currency_shadow_insert"
      BEFORE INSERT ON "121-service"."transaction"
      FOR EACH ROW EXECUTE FUNCTION "121-service"."sync_transaction_currency_columns"()
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TR_transaction_currency_shadow_update"
      BEFORE UPDATE OF "transferValue", "transferValueNumeric"
      ON "121-service"."transaction"
      FOR EACH ROW EXECUTE FUNCTION "121-service"."sync_transaction_currency_columns"()
    `);
  }

  private async dropCurrencySyncTriggers({
    queryRunner,
  }: {
    queryRunner: QueryRunner;
  }): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "TR_program_currency_shadow_insert" ON "121-service"."program"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "TR_program_currency_shadow_update" ON "121-service"."program"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS "121-service"."sync_program_currency_columns"()`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS "121-service"."validate_legacy_budget"(numeric)`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "TR_transaction_currency_shadow_insert" ON "121-service"."transaction"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "TR_transaction_currency_shadow_update" ON "121-service"."transaction"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS "121-service"."sync_transaction_currency_columns"()`,
    );
  }

  private async recreateCurrencyViews({
    queryRunner,
    useLegacyColumns = false,
  }: {
    queryRunner: QueryRunner;
    useLegacyColumns?: boolean;
  }): Promise<void> {
    // transaction_view depends on registration_view, so it is dropped first and created last
    for (const viewName of ['transaction_view', 'registration_view']) {
      await queryRunner.query(
        `DELETE FROM "121-service"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
        ['VIEW', viewName, '121-service'],
      );
      await queryRunner.query(
        `DROP VIEW IF EXISTS "121-service"."${viewName}"`,
      );
    }
    await this.createView({
      queryRunner,
      viewName: 'registration_view',
      expression: this.getRegistrationViewExpression({ useLegacyColumns }),
    });
    await this.createView({
      queryRunner,
      viewName: 'transaction_view',
      expression: this.getTransactionViewExpression({ useLegacyColumns }),
    });
  }

  private async createView({
    queryRunner,
    viewName,
    expression,
  }: {
    queryRunner: QueryRunner;
    viewName: string;
    expression: string;
  }): Promise<void> {
    await queryRunner.query(
      `CREATE VIEW "121-service"."${viewName}" AS ${expression}`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      ['121-service', 'VIEW', viewName, expression],
    );
  }

  private getRegistrationViewExpression({
    useLegacyColumns,
  }: {
    useLegacyColumns: boolean;
  }): string {
    const transferValueExpression = useLegacyColumns
      ? `"registration"."paymentAmountMultiplier" * program."fixedTransferValue"`
      : `"registration"."paymentAmountMultiplier"::text::numeric * "program"."fixedTransferValueNumeric"`;

    return `SELECT "registration"."id" AS "id", "registration"."created" AS "created", "registration"."referenceId" AS "referenceId", "registration"."registrationStatus" AS "status", "registration"."programId" AS "programId", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentCount" AS "paymentCount", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."scope" AS "scope", "fspconfig"."label" AS "programFspConfigurationLabel", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", fspconfig."name" AS "programFspConfigurationName", fspconfig."id" AS "programFspConfigurationId", fspconfig."fspName" AS "fspName", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", ${transferValueExpression} AS "transferValue", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus", \n        (CASE\n            WHEN dup."registrationId" IS NOT NULL THEN 'duplicate'\n        ELSE 'unique'\n        END)\n         AS "duplicateStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "fspconfig"."id"="registration"."programFspConfigurationId"  LEFT JOIN "121-service"."program" "program" ON "program"."id"="registration"."programId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id" LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId"  LEFT JOIN (SELECT distinct d1."registrationId" FROM "121-service"."registration_attribute_data" "d1" INNER JOIN "121-service"."registration_attribute_data" "d2" ON d1."programRegistrationAttributeId" = d2."programRegistrationAttributeId" AND "d1"."value" = "d2"."value" AND d1."registrationId" != d2."registrationId"  INNER JOIN "121-service"."registration" "registration1" ON d1."registrationId" = "registration1"."id" AND registration1."registrationStatus" != 'declined'  INNER JOIN "121-service"."registration" "registration2" ON d2."registrationId" = "registration2"."id" AND registration2."registrationStatus" != 'declined'  INNER JOIN "121-service"."program_registration_attribute" "pra" ON d1."programRegistrationAttributeId" = "pra"."id" WHERE "d1"."value" != '' AND pra."duplicateCheck" = true AND \n              NOT EXISTS (\n                SELECT 1\n                FROM "121-service".unique_registration_pair rup\n                WHERE rup."smallerRegistrationId" = LEAST(d1."registrationId", d2."registrationId")\n                  AND rup."largerRegistrationId" = GREATEST(d1."registrationId", d2."registrationId")\n              )) "dup" ON "registration"."id" = dup."registrationId" ORDER BY "registration"."registrationProgramId" ASC`;
  }

  private getTransactionViewExpression({
    useLegacyColumns,
  }: {
    useLegacyColumns: boolean;
  }): string {
    const transferValueColumn = useLegacyColumns
      ? `"t"."transferValue"`
      : `"t"."transferValueNumeric"`;

    return `SELECT "t"."id" AS "id", ${transferValueColumn} AS "transferValue", "t"."userId" AS "userId", "t"."created" AS "created", "t"."updated" AS "updated", "t"."status" AS "status", "t"."paymentId" AS "paymentId", "t"."registrationId" AS "registrationId", "event"."errorMessage" AS "errorMessage", "event"."programFspConfigurationId" AS "programFspConfigurationId", "fspconfig"."label" AS "programFspConfigurationLabel", "fspconfig"."name" AS "programFspConfigurationName", "fspconfig"."fspName" AS "fspName", "registration"."registrationStatus" AS "registrationStatus", "registration"."registrationProgramId" AS "registrationProgramId", "registration"."referenceId" AS "registrationReferenceId", "registration"."scope" AS "registrationScope", "registrationview"."duplicateStatus" AS "registrationDuplicateStatus" FROM "121-service"."transaction" "t" INNER JOIN "121-service"."last_transaction_event" "lte" ON "t"."id" = "lte"."transactionId"  LEFT JOIN "121-service"."transaction_event" "event" ON "lte"."transactionEventId" = "event"."id"  LEFT JOIN "121-service"."program_fsp_configuration" "fspconfig" ON "event"."programFspConfigurationId" = "fspconfig"."id"  LEFT JOIN "121-service"."registration" "registration" ON "t"."registrationId" = "registration"."id"  LEFT JOIN "121-service"."registration_view" "registrationview" ON "t"."registrationId" = "registrationview"."id"`;
  }
}
