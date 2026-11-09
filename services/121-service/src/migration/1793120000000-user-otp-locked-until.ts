import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOtpLockedUntil1793120000000 implements MigrationInterface {
  name = 'UserOtpLockedUntil1793120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_otp" ADD "lockedUntil" TIMESTAMP`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
