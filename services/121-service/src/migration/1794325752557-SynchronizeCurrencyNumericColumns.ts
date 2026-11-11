import { MigrationInterface, QueryRunner, View } from 'typeorm';

import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';

export class SynchronizeCurrencyNumericColumns1794325752557 implements MigrationInterface {
  name = 'SynchronizeCurrencyNumericColumns1794325752557';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.backfillNumericColumnsFromLegacy({ queryRunner });
    await this.createProgramCurrencySyncTriggers({ queryRunner });
    await this.createTransactionCurrencySyncTriggers({ queryRunner });
    await this.recreateCurrencyViews({ queryRunner });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.backfillLegacyColumnsFromNumeric({ queryRunner });
    await this.dropCurrencySyncTriggers({ queryRunner });
    await this.recreateCurrencyViews({
      queryRunner,
      useLegacyColumns: true,
    });
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
      CREATE FUNCTION "121-service"."sync_program_currency_columns"()
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
      CREATE FUNCTION "121-service"."validate_legacy_budget"(budget_value numeric)
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
      CREATE FUNCTION "121-service"."sync_transaction_currency_columns"()
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
    const registrationView = this.getView({
      queryRunner,
      viewEntity: RegistrationViewEntity,
      useLegacyColumns,
    });
    const transactionView = this.getView({
      queryRunner,
      viewEntity: TransactionViewEntity,
      useLegacyColumns,
    });

    await queryRunner.query(
      `DROP VIEW IF EXISTS "121-service"."transaction_view"`,
    );
    await queryRunner.query(
      `DROP VIEW IF EXISTS "121-service"."registration_view"`,
    );
    await queryRunner.createView(registrationView, true);
    await queryRunner.createView(transactionView, true);
  }

  private getView({
    queryRunner,
    viewEntity,
    useLegacyColumns,
  }: {
    queryRunner: QueryRunner;
    viewEntity: typeof RegistrationViewEntity | typeof TransactionViewEntity;
    useLegacyColumns: boolean;
  }): View {
    const metadata = queryRunner.connection.getMetadata(viewEntity);
    const view = View.create(metadata, queryRunner.connection.driver);
    let expression = view.expression;
    if (typeof expression !== 'string') {
      expression = expression(queryRunner.connection).getQuery();
    }

    if (useLegacyColumns) {
      expression = expression
        .replaceAll('"fixedTransferValueNumeric"', '"fixedTransferValue"')
        .replaceAll('"transferValueNumeric"', '"transferValue"');
    }

    view.expression = expression;
    return view;
  }
}