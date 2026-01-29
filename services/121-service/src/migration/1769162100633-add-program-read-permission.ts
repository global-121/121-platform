import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgramReadPermission1769162100633 implements MigrationInterface {
  name = 'AddProgramReadPermission1769162100633';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH inserted_permission AS (
        INSERT INTO "121-service"."permission" ("name")
        VALUES ('program.read')
        RETURNING "id"
      ),
      permission_to_assign AS (
        SELECT "id" FROM inserted_permission
        UNION ALL
        SELECT "id" FROM "121-service"."permission" WHERE "name" = 'program.read'
        LIMIT 1
      )
      INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT ur."id", (SELECT "id" FROM permission_to_assign)
      FROM "121-service"."user_role" ur
    `);
  }

  public async down(): Promise<void> {
    "not going to drop permissions, ain't nobody got time for that";
  }
}
