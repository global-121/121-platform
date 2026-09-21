import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveApprovalThresholdPrecision1789555673880 implements MigrationInterface {
  name = 'RemoveApprovalThresholdPrecision1789555673880';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_approval_threshold" ALTER COLUMN "thresholdAmount" TYPE numeric`,
    );
  }

  public async down(_: QueryRunner): Promise<void> {
    console.log(
      'Down migration not implemented for RemoveApprovalThresholdPrecision1789555673880',
    );
  }
}
