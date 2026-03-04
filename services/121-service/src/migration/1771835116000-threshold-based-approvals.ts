import { MigrationInterface, QueryRunner } from 'typeorm';

export class ThresholdBasedApprovals1771835116000 implements MigrationInterface {
  name = 'ThresholdBasedApprovals1771835116000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create program_approval_threshold table
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_approval_threshold" (
        "id" SERIAL NOT NULL,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "updated" TIMESTAMP NOT NULL DEFAULT now(),
        "programId" integer NOT NULL,
        "thresholdAmount" decimal(10,2) NOT NULL,
        CONSTRAINT "PK_program_approval_threshold_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_a0a41b64e26afcbf569a2ca716" ON "121-service"."program_approval_threshold" ("created")`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_approval_threshold"
       ADD CONSTRAINT "FK_program_approval_threshold_program"
       FOREIGN KEY ("programId")
       REFERENCES "121-service"."program"("id")
       ON DELETE CASCADE
       ON UPDATE NO ACTION`,
    );

    // 2. Add programApprovalThresholdId to program_aidworker_assignment
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment"
       ADD COLUMN "programApprovalThresholdId" integer NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment"
       ADD CONSTRAINT "FK_program_aidworker_assignment_approval_threshold"
       FOREIGN KEY ("programApprovalThresholdId")
       REFERENCES "121-service"."program_approval_threshold"("id")
       ON DELETE SET NULL
       ON UPDATE NO ACTION`,
    );

    // 3. Create payment_approval_aidworker junction table
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_approval_aidworker" (
        "id" SERIAL NOT NULL,
        "created" TIMESTAMP NOT NULL DEFAULT now(),
        "updated" TIMESTAMP NOT NULL DEFAULT now(),
        "paymentApprovalId" integer NOT NULL,
        "programAidworkerAssignmentId" integer NOT NULL,
        "order" integer NOT NULL,
        CONSTRAINT "PK_payment_approval_aidworker_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_241f45e2735f2edd505c56d9ee" ON "121-service"."payment_approval_aidworker" ("created")`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker"
       ADD CONSTRAINT "FK_payment_approval_aidworker_payment_approval"
       FOREIGN KEY ("paymentApprovalId")
       REFERENCES "121-service"."payment_approval"("id")
       ON DELETE CASCADE
       ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker"
       ADD CONSTRAINT "FK_payment_approval_aidworker_program_aidworker_assignment"
       FOREIGN KEY ("programAidworkerAssignmentId")
       REFERENCES "121-service"."program_aidworker_assignment"("id")
       ON DELETE CASCADE
       ON UPDATE NO ACTION`,
    );

    // 4. Add approvedByUserId to payment_approval
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval"
       ADD COLUMN "approvedByUserId" integer NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval"
       ADD CONSTRAINT "FK_payment_approval_approved_by_user"
       FOREIGN KEY ("approvedByUserId")
       REFERENCES "121-service"."user"("id")
       ON DELETE SET NULL
       ON UPDATE NO ACTION`,
    );

    // 5. Migrate data
    await this.migrateApproversToThresholds(queryRunner);
    await this.migratePaymentApprovals(queryRunner);

    // 6. Drop old approverId column and foreign key
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval"
       DROP CONSTRAINT IF EXISTS "FK_ea4575af43b630e6d37b3d4feff"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval"
       DROP COLUMN IF EXISTS "approverId"`,
    );

    // 7. Drop approver table
    await queryRunner.query(
      `DROP INDEX IF EXISTS "121-service"."IDX_845370013478fda958aaecdec5"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."approver"
       DROP CONSTRAINT IF EXISTS "FK_58ca3f250fb902accdafddd724b"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "121-service"."approver"`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration - this is a one-way migration
  }

  private async migrateApproversToThresholds(
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

      // Update all aidworker assignments that were approvers for this program
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
       INNER JOIN "121-service"."approver" a ON a.id = pa."approverId"
       WHERE pa."approverId" IS NOT NULL`,
    );

    // Set approvedByUserId based on the aidworker assignment's user
    await queryRunner.query(
      `UPDATE "121-service"."payment_approval" pa
       SET "approvedByUserId" = paa."userId"
       FROM "121-service"."approver" a
       INNER JOIN "121-service"."program_aidworker_assignment" paa
         ON paa.id = a."programAidworkerAssignmentId"
       WHERE pa."approverId" = a.id
         AND pa."approverId" IS NOT NULL`,
    );
  }
}
