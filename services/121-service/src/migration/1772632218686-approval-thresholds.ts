import { MigrationInterface, QueryRunner } from 'typeorm';

export class ApprovalThresholds1772632218686 implements MigrationInterface {
  name = 'ApprovalThresholds1772632218686';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Schema: drop old FK and add new approvedByUserId column ---
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" DROP CONSTRAINT "FK_ea4575af43b630e6d37b3d4feff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" ADD "approvedByUserId" integer`,
    );

    // --- Schema: create program_approval_threshold table ---
    await queryRunner.query(
      `CREATE TABLE "121-service"."program_approval_threshold" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "programId" integer NOT NULL, "thresholdAmount" numeric(10,2) NOT NULL, CONSTRAINT "PK_3e0aa50ab8b1a7c56a571e973f1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0a41b64e26afcbf569a2ca716" ON "121-service"."program_approval_threshold" ("created") `,
    );

    // --- Schema: create payment_approval_aidworker table ---
    await queryRunner.query(
      `CREATE TABLE "121-service"."payment_approval_aidworker" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "paymentApprovalId" integer NOT NULL, "programAidworkerAssignmentId" integer NOT NULL, CONSTRAINT "PK_7d2cd5b8c1e2abd68fdf4395cd5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_241f45e2735f2edd505c56d9ee" ON "121-service"."payment_approval_aidworker" ("created") `,
    );

    // --- Schema: add programApprovalThresholdId to program_aidworker_assignment ---
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_aidworker_assignment" ADD "programApprovalThresholdId" integer`,
    );

    // --- Schema: add FK constraints for new tables ---
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

    // --- Data: create one threshold per program and link existing approvers to it ---
    const programsWithApprovers: { programId: number }[] =
      await queryRunner.query(
        `SELECT DISTINCT paa."programId"
         FROM "121-service"."approver" a
         INNER JOIN "121-service"."program_aidworker_assignment" paa
           ON paa.id = a."programAidworkerAssignmentId"
         ORDER BY paa."programId"`,
      );

    for (const { programId } of programsWithApprovers) {
      const thresholdResult: { id: number }[] = await queryRunner.query(
        `INSERT INTO "121-service"."program_approval_threshold"
         ("programId", "thresholdAmount", "created", "updated")
         VALUES ($1, 0, now(), now())
         RETURNING id`,
        [programId],
      );
      const thresholdId = thresholdResult[0].id;

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

    // --- Data: populate payment_approval_aidworker from existing payment approvals ---
    // approverId still holds the original approver.id values at this point
    await queryRunner.query(
      `INSERT INTO "121-service"."payment_approval_aidworker"
       ("paymentApprovalId", "programAidworkerAssignmentId", "created", "updated")
       SELECT
         pa.id,
         a."programAidworkerAssignmentId",
         now(),
         now()
       FROM "121-service"."payment_approval" pa
       INNER JOIN "121-service"."approver" a ON a.id = pa."approverId"
       WHERE pa."approverId" IS NOT NULL`,
    );

    // --- Data: populate approvedByUserId with the real user.id for approved payments ---
    await queryRunner.query(
      `UPDATE "121-service"."payment_approval" pa
       SET "approvedByUserId" = paa."userId"
       FROM "121-service"."approver" a
       INNER JOIN "121-service"."program_aidworker_assignment" paa
         ON paa.id = a."programAidworkerAssignmentId"
       WHERE pa."approverId" = a.id
         AND pa."approved" = true`,
    );
    // approvedByUserId remains NULL for unapproved payments

    // --- Drop old approver table ---
    await queryRunner.query(
      `DROP INDEX IF EXISTS "121-service"."IDX_845370013478fda958aaecdec5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."approver"
       DROP CONSTRAINT IF EXISTS "FK_58ca3f250fb902accdafddd724b"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "121-service"."approver"`);

    // --- Finalize: add FK for approvedByUserId and drop the old approverId column ---
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval"
       ADD CONSTRAINT "FK_payment_approval_approved_by_user"
       FOREIGN KEY ("approvedByUserId")
       REFERENCES "121-service"."user"("id")
       ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" DROP COLUMN "approverId"`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Do we go down? No.. We don't go down..
  }
}
