import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThresholdBasedApprovals1771835116000 implements MigrationInterface {
  name = 'ThresholdBasedApprovals1771835116000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create program_approval_threshold table
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_approval_threshold" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "thresholdAmount" numeric(10,2) NOT NULL, "approvalLevel" integer NOT NULL, CONSTRAINT "PK_program_approval_threshold_id" PRIMARY KEY ("id"))`,
    );

    // Add foreign key constraint from program_approval_threshold to program
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_approval_threshold" ADD CONSTRAINT "FK_program_approval_threshold_program" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Find and drop existing foreign key constraint from payment_approval to approver
    const paymentApprovalFKs = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_schema = '121-service' 
      AND table_name = 'payment_approval' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%approver%'
    `);

    for (const fk of paymentApprovalFKs) {
      await queryRunner.query(
        `ALTER TABLE "121-service"."payment_approval" DROP CONSTRAINT "${fk.constraint_name}"`,
      );
    }

    // Drop approverId column from payment_approval table
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" DROP COLUMN IF EXISTS "approverId"`,
    );

    // Add approvalThresholdId column to payment_approval table
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD "approvalThresholdId" integer`,
    );

    // Add approvalThresholdId column to approver table
    await queryRunner.query(
      `ALTER TABLE "121-service"."approver" ADD "approvalThresholdId" integer`,
    );

    // Add foreign key constraint from approver to program_approval_threshold
    await queryRunner.query(
      `ALTER TABLE "121-service"."approver" ADD CONSTRAINT "FK_approver_program_approval_threshold" FOREIGN KEY ("approvalThresholdId") REFERENCES "121-service"."program_approval_threshold"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Add foreign key constraint from payment_approval to program_approval_threshold
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD CONSTRAINT "FK_payment_approval_program_approval_threshold" FOREIGN KEY ("approvalThresholdId") REFERENCES "121-service"."program_approval_threshold"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint from payment_approval to program_approval_threshold
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" DROP CONSTRAINT "FK_payment_approval_program_approval_threshold"`,
    );

    // Drop foreign key constraint from approver to program_approval_threshold
    await queryRunner.query(
      `ALTER TABLE "121-service"."approver" DROP CONSTRAINT "FK_approver_program_approval_threshold"`,
    );

    // Drop approvalThresholdId column from approver table
    await queryRunner.query(
      `ALTER TABLE "121-service"."approver" DROP COLUMN "approvalThresholdId"`,
    );

    // Drop approvalThresholdId column from payment_approval table
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" DROP COLUMN "approvalThresholdId"`,
    );

    // Re-add approverId column to payment_approval table
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD "approverId" integer`,
    );

    // Re-add foreign key constraint from payment_approval to approver
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD CONSTRAINT "FK_payment_approval_approver" FOREIGN KEY ("approverId") REFERENCES "121-service"."approver"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Drop foreign key constraint from program_approval_threshold to program
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_approval_threshold" DROP CONSTRAINT "FK_program_approval_threshold_program"`,
    );

    // Drop program_approval_threshold table
    await queryRunner.query(
      `DROP TABLE "121-service"."program_approval_threshold"`,
    );
  }
}
