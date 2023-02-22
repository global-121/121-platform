import { MigrationInterface, QueryRunner } from 'typeorm';

export class DuplicateCheckCustomAttribute1677077884528
  implements MigrationInterface
{
  name = 'DuplicateCheckCustomAttribute1677077884528';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "duplicateCheck" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "duplicateCheck"`,
    );
  }
}
