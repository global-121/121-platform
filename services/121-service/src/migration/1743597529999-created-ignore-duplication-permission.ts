import { MigrationInterface, QueryRunner } from 'typeorm';

import { DefaultUserRole } from '@121-service/src/user/user-role.enum';

export class CreatedIgnoreDuplicationPermission1743597529999
  implements MigrationInterface
{
  name = 'CreatedIgnoreDuplicationPermission1743597529999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    let permissionIdQuery = await queryRunner.query(
      `SELECT "id" FROM "121-service"."permission" where name = 'registration:duplication.delete'`,
    );

    if (permissionIdQuery.length === 0) {
      await queryRunner.query(
        `INSERT INTO "121-service"."permission" ("name") VALUES ('registration:duplication.delete')`,
      );

      permissionIdQuery = await queryRunner.query(
        `SELECT "id" FROM "121-service"."permission" where name = 'registration:duplication.delete'`,
      );
    }

    const permissionId = permissionIdQuery[0].id;

    const cvaRoleIdQuery = await queryRunner.query(
      `SELECT "id" FROM "121-service"."user_role" where "role" = '${DefaultUserRole.CvaManager}'`,
    );

    if (cvaRoleIdQuery.length === 0) {
      return;
    }

    const cvaRoleId = cvaRoleIdQuery[0].id;

    const roleAssignment = await queryRunner.query(
      `SELECT "userRoleId" FROM "121-service"."user_role_permissions_permission" where "userRoleId" = ${cvaRoleId} and "permissionId" = ${permissionId}`,
    );

    if (roleAssignment.length === 0)
      await queryRunner.query(
        `INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId") VALUES (${cvaRoleId}, ${permissionId})`,
      );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Down migration not implemented
  public async down(): Promise<void> {}
}
