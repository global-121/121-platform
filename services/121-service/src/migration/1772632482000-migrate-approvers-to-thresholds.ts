import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateApproversToThresholds1772632482000 implements MigrationInterface {
  name = 'MigrateApproversToThresholds1772632482000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create thresholds and assign approvers
    await this.createThresholdsAndAssignApprovers(queryRunner);

    // Step 2: Migrate payment approval data
    await this.migratePaymentApprovals(queryRunner);

    // Step 3: Drop old approver table
    await this.dropApproverTable(queryRunner);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration - this is a one-way data migration
  }

  private async createThresholdsAndAssignApprovers(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Get all programs that have approvers
    const programsWithApprovers = await queryRunner.query(
      `SELECT DISTINCT paa."programId"
       FROM "121-service"."approver" a
       INNER JOIN "121-service"."program_aidworker_assignment" paa
         ON paa.id = a."programAidworkerAssignmentId"
       ORDER BY paa."programId"`,
    );

    for (const { programId } of programsWithApprovers) {
      // Create a single threshold at amount 0 (covers all payments)
      const thresholdResult = await queryRunner.query(
        `INSERT INTO "121-service"."program_approval_threshold"
         ("programId", "thresholdAmount", "created", "updated")
         VALUES ($1, 0, now(), now())
         RETURNING id`,
        [programId],
      );

      const thresholdId = thresholdResult[0].id;

      // Assign all approvers for this program to the threshold
      await queryRunner.query(
        `UPDATE "121-service"."program_aidworker_assignment"
         SET "programApprovalThresholdId" = $1
         WHERE id IN (
           SELECT a."programAidworkerAssignmentId"
           FROM "121-service"."approver" a
           INNER JOIN "121-service"."program_aidworker_assignment" paa
             ON paa.id = a."programAidworkerAssignmentId"
           WHERE paa."programId" = $2
         )`,
        [thresholdId, programId],
      );
    }
  }

  private async migratePaymentApprovals(
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Create payment_approval_aidworker entries for all existing approved payments
    await queryRunner.query(
      `INSERT INTO "121-service"."payment_approval_aidworker"
       ("paymentApprovalId", "programAidworkerAssignmentId", "order", "created", "updated")
       SELECT
         pa.id,
         a."programAidworkerAssignmentId",
         1,
         now(),
         now()
       FROM "121-service"."payment_approval" pa
       INNER JOIN "121-service"."approver" a ON a.id = pa."approvedByUserId"
       WHERE pa."approvedByUserId" IS NOT NULL`,
    );

    // Fix approvedByUserId to point to actual user instead of approver
    // (currently it points to approver.id because it was renamed from approverId)
    await queryRunner.query(
      `UPDATE "121-service"."payment_approval" pa
       SET "approvedByUserId" = paa."userId"
       FROM "121-service"."approver" a
       INNER JOIN "121-service"."program_aidworker_assignment" paa
         ON paa.id = a."programAidworkerAssignmentId"
       WHERE pa."approvedByUserId" = a.id
         AND pa."approvedByUserId" IS NOT NULL`,
    );
  }

  private async dropApproverTable(queryRunner: QueryRunner): Promise<void> {
    // Drop the old approver table - it's no longer needed
    await queryRunner.query(
      `DROP INDEX IF EXISTS "121-service"."IDX_845370013478fda958aaecdec5"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."approver"
       DROP CONSTRAINT IF EXISTS "FK_58ca3f250fb902accdafddd724b"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "121-service"."approver"`);
  }
}
