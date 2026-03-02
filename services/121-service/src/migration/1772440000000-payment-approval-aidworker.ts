import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentApprovalAidworker1772440000000 implements MigrationInterface {
  name = 'PaymentApprovalAidworker1772440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create payment_approval_aidworker junction table
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

    // Create index on created column (inherited from Base121Entity)
    await queryRunner.query(
      `CREATE INDEX "IDX_payment_approval_aidworker_created" ON "121-service"."payment_approval_aidworker" ("created")`,
    );

    // Add foreign key constraints
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

    // Migrate existing data: for each payment_approval with a threshold,
    // create junction records to all aidworkers assigned to that threshold
    await queryRunner.query(`
      INSERT INTO "121-service"."payment_approval_aidworker" 
        ("paymentApprovalId", "programAidworkerAssignmentId", "order", "created", "updated")
      SELECT 
        pa.id as "paymentApprovalId",
        paa.id as "programAidworkerAssignmentId",
        ROW_NUMBER() OVER (PARTITION BY pa.id ORDER BY paa.id) as "order",
        pa.created,
        pa.updated
      FROM "121-service"."payment_approval" pa
      INNER JOIN "121-service"."program_aidworker_assignment" paa 
        ON paa."programApprovalThresholdId" = pa."programApprovalThresholdId"
      WHERE pa."programApprovalThresholdId" IS NOT NULL
    `);

    // Drop the old foreign key constraint from payment_approval to program_approval_threshold
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" 
       DROP CONSTRAINT IF EXISTS "FK_payment_approval_program_approval_threshold"`,
    );

    // Drop the programApprovalThresholdId column from payment_approval
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" 
       DROP COLUMN IF EXISTS "programApprovalThresholdId"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add programApprovalThresholdId column
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" 
       ADD "programApprovalThresholdId" integer NULL`,
    );

    // Re-add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval" 
       ADD CONSTRAINT "FK_payment_approval_program_approval_threshold" 
       FOREIGN KEY ("programApprovalThresholdId") 
       REFERENCES "121-service"."program_approval_threshold"("id") 
       ON DELETE SET NULL 
       ON UPDATE NO ACTION`,
    );

    // Migrate data back (best effort - may lose data if multiple aidworkers per approval)
    await queryRunner.query(`
      UPDATE "121-service"."payment_approval" pa
      SET "programApprovalThresholdId" = paa."programApprovalThresholdId"
      FROM "121-service"."payment_approval_aidworker" paaw
      INNER JOIN "121-service"."program_aidworker_assignment" paa 
        ON paa.id = paaw."programAidworkerAssignmentId"
      WHERE pa.id = paaw."paymentApprovalId"
      AND paaw."order" = 1
    `);

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker" 
       DROP CONSTRAINT "FK_payment_approval_aidworker_program_aidworker_assignment"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."payment_approval_aidworker" 
       DROP CONSTRAINT "FK_payment_approval_aidworker_payment_approval"`,
    );

    // Drop the junction table
    await queryRunner.query(
      `DROP TABLE "121-service"."payment_approval_aidworker"`,
    );
  }
}
