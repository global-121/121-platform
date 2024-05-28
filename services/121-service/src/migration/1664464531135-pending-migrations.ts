import { MigrationInterface, QueryRunner } from 'typeorm';

export class pendingMigrations1664464531135 implements MigrationInterface {
  name = 'pendingMigrations1664464531135';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f07a1f50a3d185ac010a45b47e"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_3f6d1a5c94b04939e126be3e50"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_744096f17fbdd04b58dc7fcd7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" DROP COLUMN "monitoringQuestion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_5423104a960c57439e028eb57c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "programId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f07a1f50a3d185ac010a45b47e" ON "121-service"."registration_data" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a01e1fafed731932cd8f3e4d80" ON "121-service"."whatsapp_template_test" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d63c6005815c8412832f944999" ON "121-service"."whatsapp_template_test" ("sessionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_5423104a960c57439e028eb57c5" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" ADD CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a" FOREIGN KEY ("registrationId") REFERENCES "121-service"."registration"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" ADD CONSTRAINT "FK_06012ed04be71b8bef3a3968ead" FOREIGN KEY ("userRoleId") REFERENCES "121-service"."user_role"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" ADD CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95" FOREIGN KEY ("permissionId") REFERENCES "121-service"."permission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" DROP CONSTRAINT "FK_f0ca2057b5085083ff9f18e3f95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."user_role_permissions_permission" DROP CONSTRAINT "FK_06012ed04be71b8bef3a3968ead"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."try_whatsapp" DROP CONSTRAINT "FK_f9302bf2f79e322f0e35357e80a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_5423104a960c57439e028eb57c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_d63c6005815c8412832f944999"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_a01e1fafed731932cd8f3e4d80"`,
    );
    await queryRunner.query(
      `DROP INDEX "121-service"."IDX_f07a1f50a3d185ac010a45b47e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ALTER COLUMN "programId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_5423104a960c57439e028eb57c5" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."instance" ADD "monitoringQuestion" json`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_744096f17fbdd04b58dc7fcd7f" ON "121-service"."whatsapp_template_test" ("sessionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f6d1a5c94b04939e126be3e50" ON "121-service"."whatsapp_template_test" ("created") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f07a1f50a3d185ac010a45b47e" ON "121-service"."registration_data" ("registrationId", "programQuestionId", "fspQuestionId", "programCustomAttributeId", "monitoringQuestionId") `,
    );
  }
}
