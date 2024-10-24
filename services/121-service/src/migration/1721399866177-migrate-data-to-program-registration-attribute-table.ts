import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateDataToProgramRegistrationAttributeTable1721399866177
  implements MigrationInterface
{
  name = 'MigrateDataToProgramRegistrationAttributeTable1721399866177';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
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
          false AS "editableInPortal"  -- Set a default value as it's not present in the old table
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
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `TRUNCATE "121-service".program_registration_attribute RESTART IDENTITY CASCADE`,
      );
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }
  }
}
