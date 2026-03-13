import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgramAttachmentsUpdatePermission1773406855334 implements MigrationInterface {
  name = 'AddProgramAttachmentsUpdatePermission1773406855334';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH inserted_permission AS (
        INSERT INTO "121-service"."permission" ("name")
        VALUES ('program:attachments.update')
        ON CONFLICT ("name") DO NOTHING
        RETURNING "id"
      ),
      update_permission AS (
        SELECT "id" FROM inserted_permission
        UNION ALL
        SELECT "id"
        FROM "121-service"."permission"
        WHERE "name" = 'program:attachments.update'
        LIMIT 1
      ),
      delete_permission AS (
        SELECT "id"
        FROM "121-service"."permission"
        WHERE "name" = 'program:attachments.delete'
        LIMIT 1
      )
      INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT urpp."userRoleId", (SELECT "id" FROM update_permission)
      FROM "121-service"."user_role_permissions_permission" urpp
      WHERE urpp."permissionId" = (SELECT "id" FROM delete_permission)
      AND NOT EXISTS (
        SELECT 1
        FROM "121-service"."user_role_permissions_permission" existing
        WHERE existing."userRoleId" = urpp."userRoleId"
          AND existing."permissionId" = (SELECT "id" FROM update_permission)
      )
    `);
  }

  public async down(): Promise<void> {
    // Intentionally left empty: we do not remove permissions in down migrations.
    return;
  }
}
