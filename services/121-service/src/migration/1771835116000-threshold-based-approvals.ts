import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThresholdBasedApprovals1771835116000 implements MigrationInterface {
  name = 'ThresholdBasedApprovals1771835116000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create program_approval_threshold table
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_approval_threshold" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "thresholdAmount" numeric(10,2) NOT NULL, CONSTRAINT "PK_program_approval_threshold_id" PRIMARY KEY ("id"))`,
    );

    // Create index on created column (inherited from Base121Entity)
    await queryRunner.query(
      `CREATE INDEX "IDX_a0a41b64e26afcbf569a2ca716" ON "121-service"."program_approval_threshold" ("created")`,
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

    // Add programApprovalThresholdId column to payment_approval table (nullable for historical records)
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD "programApprovalThresholdId" integer NULL`,
    );

    // Add approvedByUserId column to payment_approval table for audit trail
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD "approvedByUserId" integer NULL`,
    );

    // Add foreign key constraint from payment_approval to program_approval_threshold
    // Use SET NULL to preserve historical payment approval records even when threshold config is deleted
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD CONSTRAINT "FK_payment_approval_program_approval_threshold" FOREIGN KEY ("programApprovalThresholdId") REFERENCES "121-service"."program_approval_threshold"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Add programApprovalThresholdId column to program_aidworker_assignment table
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD "programApprovalThresholdId" integer NULL`,
    );

    // Data migration: Create default approval thresholds for programs with approvers
    // For each program that has approvers, create a threshold with amount 0
    const programsWithApprovers = await queryRunner.query(`
      SELECT DISTINCT paa."programId"
      FROM "121-service"."approver" a
      INNER JOIN "121-service"."program_aidworker_assignment" paa ON paa.id = a."programAidworkerAssignmentId"
    `);

    for (const row of programsWithApprovers) {
      // Insert default threshold for this program
      const thresholdResult = await queryRunner.query(
        `INSERT INTO "121-service"."program_approval_threshold" ("programId", "thresholdAmount", "created", "updated")
         VALUES ($1, 0, now(), now())
         RETURNING id`,
        [row.programId],
      );
      const thresholdId = thresholdResult[0].id;

      // Update all aidworker assignments that have an approver for this program
      await queryRunner.query(
        `UPDATE "121-service"."program_aidworker_assignment" paa
         SET "programApprovalThresholdId" = $1
         FROM "121-service"."approver" a
         WHERE paa.id = a."programAidworkerAssignmentId"
         AND paa."programId" = $2`,
        [thresholdId, row.programId],
      );
    }

    // Add foreign key constraint from program_aidworker_assignment to program_approval_threshold
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD CONSTRAINT "FK_program_aidworker_assignment_approval_threshold" FOREIGN KEY ("programApprovalThresholdId") REFERENCES "121-service"."program_approval_threshold"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Drop the approver table as it's no longer needed
    await queryRunner.query(
      `DROP TABLE IF EXISTS "121-service"."approver" CASCADE`,
    );
  }

  public async down(): Promise<void> {
    //we never go down. No way back from this.
  }
}
