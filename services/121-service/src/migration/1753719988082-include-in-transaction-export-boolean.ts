import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncludeInTransactionExportBoolean1753719988082 implements MigrationInterface {
  name = 'IncludeInTransactionExportBoolean1753719988082';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const programRegistrationAttributes = await queryRunner.query(
      `SELECT * FROM "121-service"."program_registration_attribute"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ADD "includeInTransactionExport" boolean NOT NULL DEFAULT false`,
    );

    for (const attribute of programRegistrationAttributes) {
      if (
        attribute.export &&
        Array.isArray(attribute.export) &&
        attribute.export.includes('payment')
      ) {
        await queryRunner.query(
          `UPDATE "121-service"."program_registration_attribute" SET "includeInTransactionExport" = true WHERE "id" = $1`,
          [attribute.id],
        );
      }
    }
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" DROP COLUMN "export"`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    console.log('We only move forward, there is no going back!');
  }
}
