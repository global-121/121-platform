import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgramRegistrationAttributesReadPermission1789000000000
  implements MigrationInterface
{
  name = 'AddProgramRegistrationAttributesReadPermission1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "121-service"."permission" ("name")
      SELECT 'program:registration-attributes.read'
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service"."permission"
        WHERE "name" = 'program:registration-attributes.read'
      );
    `);

    await queryRunner.query(`
      INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId")
      SELECT ur."id", p."id"
      FROM "121-service"."user_role" ur, "121-service"."permission" p
      WHERE p."name" = 'program:registration-attributes.read'
        AND (
          ur."role" = 'program-admin'
          OR (
            EXISTS (
              SELECT 1
              FROM "121-service"."user_role_permissions_permission" urp
              INNER JOIN "121-service"."permission" permission
                ON permission."id" = urp."permissionId"
              WHERE urp."userRoleId" = ur."id"
                AND permission."name" = 'registration:personal.read'
            )
          )
        )
        AND NOT EXISTS (
          SELECT 1 FROM "121-service"."user_role_permissions_permission" urp
          WHERE urp."userRoleId" = ur."id"
            AND urp."permissionId" = p."id"
        );
    `);
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve();
  }
}
