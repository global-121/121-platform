import { MigrationInterface, QueryRunner } from 'typeorm';

export class addReminderCounter1675755625702 implements MigrationInterface {
  name = 'addReminderCounter1675755625702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" ADD "reminderCount" integer DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" DROP CONSTRAINT "FK_dde01a7a751285564545fe8ac50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" ALTER COLUMN "registrationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87475bf1f4196cbe646125e503" ON "121-service"."intersolve_barcode" ("reminderCount") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" ADD CONSTRAINT "FK_dde01a7a751285564545fe8ac50" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" DROP CONSTRAINT "FK_dde01a7a751285564545fe8ac50"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_87475bf1f4196cbe646125e503"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" ALTER COLUMN "registrationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration_status_change" ADD CONSTRAINT "FK_dde01a7a751285564545fe8ac50" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."intersolve_barcode" DROP COLUMN "reminderCount"`,
    );
  }
}
