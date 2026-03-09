import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropOrderColumnFromPaymentApprovalAidworker1773059300000 implements MigrationInterface {
  name = 'DropOrderColumnFromPaymentApprovalAidworker1773059300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker" DROP COLUMN "order"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker" ADD "order" integer NOT NULL DEFAULT 1`,
    );
  }
}
