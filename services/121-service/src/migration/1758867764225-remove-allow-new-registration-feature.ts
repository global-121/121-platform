import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllowNewRegistrationFeature1758867764225 implements MigrationInterface {
  name = 'AddAllowNewRegistrationFeature1758867764225';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "published"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD COLUMN "published" boolean NOT NULL DEFAULT false`,
    );
  }
}
