import { MigrationInterface, QueryRunner } from 'typeorm';

export class PhasesToShowInPaTable1715014151242 implements MigrationInterface {
  name = 'PhasesToShowInPaTable1715014151242';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionsToDelete = await queryRunner.query(
      `SELECT "id" FROM "121-service"."permission"
       WHERE "name" IN ('program:phase.update')`,
    );

    const permissionIds = permissionsToDelete.map((perm) => perm.id);

    if (permissionIds.length > 0) {
      await queryRunner.query(
        `DELETE FROM "121-service"."user_role_permissions_permission"
         WHERE "permissionId" IN (${permissionIds.join(', ')})`,
      );

      await queryRunner.query(
        `DELETE FROM "121-service"."permission"
         WHERE "id" IN (${permissionIds.join(', ')})`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "121-service"."program" DROP COLUMN "phase"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "showInPeopleAffectedTable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD "showInPeopleAffectedTable" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD "showInPeopleAffectedTable" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      UPDATE "121-service"."program_custom_attribute"
      SET "showInPeopleAffectedTable" = true
      WHERE json_array_length("phases") > 0
    `);

    await queryRunner.query(`
      UPDATE "121-service"."program_question"
      SET "showInPeopleAffectedTable" = true
      WHERE json_array_length("phases") > 0
    `);

    await queryRunner.query(`
      UPDATE "121-service"."financial_service_provider_question"
      SET "showInPeopleAffectedTable" = true
      WHERE json_array_length("phases") > 0
    `);

    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "phases"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP COLUMN "phases"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "phases"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" DROP COLUMN "showInPeopleAffectedTable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" ADD "showInPeopleAffectedTable" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" DROP COLUMN "showInPeopleAffectedTable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" ADD "showInPeopleAffectedTable" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" DROP COLUMN "showInPeopleAffectedTable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" ADD "showInPeopleAffectedTable" json NOT NULL DEFAULT '[]'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program" ADD "phase" character varying NOT NULL DEFAULT 'design'`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."financial_service_provider_question" RENAME COLUMN "showInPeopleAffectedTable" TO "phases"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_question" RENAME COLUMN "showInPeopleAffectedTable" TO "phases"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_custom_attribute" RENAME COLUMN "showInPeopleAffectedTable" TO "phases"`,
    );
  }
}
