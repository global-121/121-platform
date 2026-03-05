import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApprovalThresholds1772632218686 implements MigrationInterface {
  name = 'ApprovalThresholds1772632218686';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" DROP CONSTRAINT "FK_ea4575af43b630e6d37b3d4feff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" RENAME COLUMN "approverId" TO "approvedByUserId"`,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_approval_threshold" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "thresholdAmount" numeric(10,2) NOT NULL, CONSTRAINT "PK_3e0aa50ab8b1a7c56a571e973f1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0a41b64e26afcbf569a2ca716" ON "121-service"."program_approval_threshold" ("created") `,
    );
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_approval_aidworker" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "paymentApprovalId" integer NOT NULL, "programAidworkerAssignmentId" integer NOT NULL, "order" integer NOT NULL, CONSTRAINT "PK_7d2cd5b8c1e2abd68fdf4395cd5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_241f45e2735f2edd505c56d9ee" ON "121-service"."payment_approval_aidworker" ("created") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD "programApprovalThresholdId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_approval_threshold" ADD CONSTRAINT "FK_program_approval_threshold_program" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_program_aidworker_assignment_approval_threshold" FOREIGN KEY ("programApprovalThresholdId") REFERENCES "121-service"."program_approval_threshold"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker" ADD CONSTRAINT "FK_payment_approval_aidworker_payment_approval" FOREIGN KEY ("paymentApprovalId") REFERENCES "121-service"."payment_approval"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker" ADD CONSTRAINT "FK_payment_approval_aidworker_program_aidworker_assignment" FOREIGN KEY ("programAidworkerAssignmentId") REFERENCES "121-service"."program_aidworker_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // Note: FK from payment_approval.approvedByUserId to user(id) will be added after data migration
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Do we go down? No.. We don't go down..
  }
}
