import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateFspDisplayNamePortalDataToDisplayName1710080807910 implements MigrationInterface {
  name = 'MigrateFspDisplayNamePortalDataToDisplayName1710080807910';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    // migrate existing data from fspDisplayNamePaApp / fspDisplayNamePortal to displayName
    // await this.migrateFspDisplayName(queryRunner);
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "121-service"."financial_service_provider" SET "displayName" = NULL`,
    );
  }
}
