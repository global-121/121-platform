import { MigrationInterface, QueryRunner } from 'typeorm';

export class FspPortalDisplayName1679493908292 implements MigrationInterface {
  name = 'FspPortalDisplayName1679493908292';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" RENAME COLUMN "fspDisplayName" to "fspDisplayNamePaApp"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" ADD "fspDisplayNamePortal" character varying`,
    );
    await queryRunner.query(
      `UPDATE "121-service"."fsp" SET "fspDisplayNamePortal" = "fsp"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" DROP COLUMN "fspDisplayNamePortal"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" RENAME COLUMN "fspDisplayNamePaApp" to "fspDisplayName"`,
    );
  }
}
