import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePeopleAffected1739294207739 implements MigrationInterface {
  name = 'RenamePeopleAffected1739294207739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["all-registrations","included"]'`,
    );
    await this.migrateData(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["all-people-affected","included"]'`,
    );
  }

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    const oldExportTypeString = 'all-people-affected';
    const newExportTypeString = 'all-registrations';

    const programRegistrationAttributes = await queryRunner.query(`
      SELECT id, export
      FROM "121-service"."program_registration_attribute"
    `);

    for (const programCustomAttribute of programRegistrationAttributes) {
      const updatedExport = programCustomAttribute.export.map((item: any) =>
        item === oldExportTypeString ? newExportTypeString : item,
      );

      await queryRunner.query(
        `
        UPDATE "121-service"."program_registration_attribute"
        SET export = $1
        WHERE id = $2
      `,
        [JSON.stringify(updatedExport), programCustomAttribute.id],
      );
    }
  }
}
