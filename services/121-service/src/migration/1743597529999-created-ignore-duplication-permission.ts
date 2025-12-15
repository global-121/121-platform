import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatedIgnoreDuplicationPermission1743597529999 implements MigrationInterface {
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

    const rolesToAssign = ['cva-manager', 'admin', 'program-admin'];

    // Loop through each role and assign the permission
    for (const role of rolesToAssign) {
      const roleIdQuery = await queryRunner.query(
        `SELECT "id" FROM "121-service"."user_role" where "role" = '${role}'`,
      );

      if (roleIdQuery.length === 0) {
        // Skip if this role doesn't exist
        continue;
      }

      const roleId = roleIdQuery[0].id;

      const roleAssignment = await queryRunner.query(
        `SELECT "userRoleId" FROM "121-service"."user_role_permissions_permission" where "userRoleId" = ${roleId} and "permissionId" = ${permissionId}`,
      );

      if (roleAssignment.length === 0) {
        await queryRunner.query(
          `INSERT INTO "121-service"."user_role_permissions_permission" ("userRoleId", "permissionId") VALUES (${roleId}, ${permissionId})`,
        );
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function -- Down migration not implemented
  public async down(): Promise<void> {}
}
