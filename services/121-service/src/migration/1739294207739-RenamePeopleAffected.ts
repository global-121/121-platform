import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenamePeopleAffected1739294207739 implements MigrationInterface {
  name = 'RenamePeopleAffected1739294207739';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["all-registrations","included"]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_registration_attribute" ALTER COLUMN "export" SET DEFAULT '["all-people-affected","included"]'`,
    );
  }
}
