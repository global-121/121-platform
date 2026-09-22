import { MigrationInterface, QueryRunner } from 'typeorm';

interface LegacyExcelConfigurationRow {
  id: number;
  programId: number;
  uniqueIdentifierField: string | null;
  exportFields: string | null;
}

interface ProgramAttributeRow {
  programId: number;
  name: string;
}

export class MoveExcelFspConfigurationProperties1792585532775 implements MigrationInterface {
  name = 'MoveExcelFspConfigurationProperties1792585532775';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "121-service"."excel_fsp_configuration" (
        "id" SERIAL NOT NULL,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "updated" TIMESTAMP NOT NULL DEFAULT now(),
        "programFspConfigurationId" integer NOT NULL,
        "uniqueIdentifierField" character varying NOT NULL,
        "exportFields" text[] NOT NULL DEFAULT '{}',
        CONSTRAINT "PK_excel_fsp_configuration_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_excel_fsp_configuration_program_fsp_configuration_id" UNIQUE ("programFspConfigurationId"),
        CONSTRAINT "FK_e5efd739674fa8ede656ec65f69" FOREIGN KEY ("programFspConfigurationId") REFERENCES "121-service"."program_fsp_configuration"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_05a4f1e194b88085595c42b52b" ON "121-service"."excel_fsp_configuration" ("created")`,
    );

    const legacyConfigurations: LegacyExcelConfigurationRow[] =
      await queryRunner.query(`
        SELECT configuration."id",
               configuration."programId",
               match_property."value" AS "uniqueIdentifierField",
               export_property."value" AS "exportFields"
        FROM "121-service"."program_fsp_configuration" configuration
        LEFT JOIN "121-service"."program_fsp_configuration_property" match_property
          ON match_property."programFspConfigurationId" = configuration."id"
          AND match_property."name" = 'columnToMatch'
        LEFT JOIN "121-service"."program_fsp_configuration_property" export_property
          ON export_property."programFspConfigurationId" = configuration."id"
          AND export_property."name" = 'columnsToExport'
        WHERE configuration."fspName" = 'Excel'
      `);

    const programIds = [
      ...new Set(legacyConfigurations.map(({ programId }) => programId)),
    ];
    const programAttributes: ProgramAttributeRow[] = programIds.length
      ? await queryRunner.query(
          `SELECT "programId", "name"
           FROM "121-service"."program_registration_attribute"
           WHERE "programId" = ANY($1::integer[])`,
          [programIds],
        )
      : [];

    const attributeNamesByProgram = new Map<number, Set<string>>();
    for (const { programId, name } of programAttributes) {
      const names = attributeNamesByProgram.get(programId) ?? new Set<string>();
      names.add(name);
      attributeNamesByProgram.set(programId, names);
    }

    await queryRunner.query(`
      UPDATE "121-service"."program_fsp_configuration"
      SET "state" = 'configuration-pending'
      WHERE "fspName" = 'Excel'
    `);

    for (const configuration of legacyConfigurations) {
      const validAttributeNames =
        attributeNamesByProgram.get(configuration.programId) ??
        new Set<string>();
      const identifier = configuration.uniqueIdentifierField;
      if (!identifier || !validAttributeNames.has(identifier)) {
        console.warn(
          `Skipping Excel FSP configuration ${configuration.id}: unique identifier field is missing or is not a program registration attribute.`,
        );
        continue;
      }

      const exportFields = this.getValidExportFields({
        configuration,
        validAttributeNames,
      });
      if (!exportFields) {
        continue;
      }

      await queryRunner.query(
        `INSERT INTO "121-service"."excel_fsp_configuration" (
           "programFspConfigurationId", "uniqueIdentifierField", "exportFields"
         ) VALUES ($1, $2, $3)`,
        [configuration.id, identifier, exportFields],
      );
      await queryRunner.query(
        `UPDATE "121-service"."program_fsp_configuration"
         SET "state" = 'configured'
         WHERE "id" = $1`,
        [configuration.id],
      );
    }

    await queryRunner.query(`
      DELETE FROM "121-service"."program_fsp_configuration_property" property
      USING "121-service"."program_fsp_configuration" configuration
      WHERE property."programFspConfigurationId" = configuration."id"
        AND configuration."fspName" = 'Excel'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."program_fsp_configuration_property"
        ("programFspConfigurationId", "name", "value")
      SELECT "programFspConfigurationId", 'columnToMatch', "uniqueIdentifierField"
      FROM "121-service"."excel_fsp_configuration"
    `);
    await queryRunner.query(`
      INSERT INTO "121-service"."program_fsp_configuration_property"
        ("programFspConfigurationId", "name", "value")
      SELECT "programFspConfigurationId", 'columnsToExport', to_json("exportFields")::text
      FROM "121-service"."excel_fsp_configuration"
    `);
    await queryRunner.query(`
      UPDATE "121-service"."program_fsp_configuration" configuration
      SET "state" = CASE
        WHEN EXISTS (
          SELECT 1 FROM "121-service"."excel_fsp_configuration" excel_configuration
          WHERE excel_configuration."programFspConfigurationId" = configuration."id"
        ) THEN 'configured'
        ELSE 'configuration-pending'
      END
      WHERE configuration."fspName" = 'Excel'
    `);
    await queryRunner.query(
      `DROP TABLE "121-service"."excel_fsp_configuration"`,
    );
  }

  private getValidExportFields({
    configuration,
    validAttributeNames,
  }: {
    configuration: LegacyExcelConfigurationRow;
    validAttributeNames: Set<string>;
  }): string[] | null {
    if (!configuration.exportFields) {
      return [...validAttributeNames];
    }

    let parsedExportFields: unknown;
    try {
      parsedExportFields = JSON.parse(configuration.exportFields);
    } catch {
      console.warn(
        `Skipping Excel FSP configuration ${configuration.id}: export fields contain invalid JSON.`,
      );
      return null;
    }

    if (!Array.isArray(parsedExportFields)) {
      console.warn(
        `Skipping Excel FSP configuration ${configuration.id}: export fields must be a JSON array.`,
      );
      return null;
    }

    const validExportFields = parsedExportFields.filter(
      (field): field is string =>
        typeof field === 'string' && validAttributeNames.has(field),
    );
    const skippedCount = parsedExportFields.length - validExportFields.length;
    if (skippedCount > 0) {
      console.warn(
        `Skipped ${skippedCount} invalid Excel export field(s) for configuration ${configuration.id}.`,
      );
    }

    return [...new Set(validExportFields)];
  }
}
