import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetAttributeLabelsNullable1778621834090 implements MigrationInterface {
  name = 'SetAttributeLabelsNullable1778621834090';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboLabel" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "label" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "label" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "koboLabel" SET NOT NULL`,
    );
  }
}
