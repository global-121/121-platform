import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOtpIssuedAt1793110000000 implements MigrationInterface {
  name = 'UserOtpIssuedAt1793110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_otp" ADD "issuedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_otp" ALTER COLUMN "issuedAt" DROP DEFAULT`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
