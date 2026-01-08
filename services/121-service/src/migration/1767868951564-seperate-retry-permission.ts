import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeperateRetryPermission1767868951564 implements MigrationInterface {
  name = 'SeperateRetryPermission1767868951564';
  closestPermissionName = 'payment.update';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await addPermissionRolesBasedOnClosestPermission(
      queryRunner,
      this.closestPermissionName,
      'payment.retry',
    );

    await addPermissionRolesBasedOnClosestPermission(
      queryRunner,
      this.closestPermissionName,
      'payment.start',
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}

async function addPermissionRolesBasedOnClosestPermission(
  queryRunner: QueryRunner,
  closestPermissionName: string,
  newPermissionName: string,
) {
  // Add the new permission if it doesn't exist
  await addPermission(newPermissionName, queryRunner);

  // Get role ids that have the closest permission
  const rolesWithClosestPermission: { userRoleId: number }[] =
    await queryRunner.query(`
      SELECT urp."userRoleId"
      FROM "121-service".user_role_permissions_permission urp
      JOIN "121-service".permission p ON urp."permissionId" = p.id
      WHERE p.name = '${closestPermissionName}';
    `);

  // Assign the new permission to those roles
  for (const role of rolesWithClosestPermission) {
    await queryRunner.query(`
      INSERT INTO "121-service".user_role_permissions_permission ("userRoleId", "permissionId")
      SELECT ${role.userRoleId}, p.id
      FROM "121-service".permission p
      WHERE p.name = '${newPermissionName}'
        AND NOT EXISTS (
          SELECT 1 FROM "121-service".user_role_permissions_permission urp
          WHERE urp."userRoleId" = ${role.userRoleId} AND urp."permissionId" = p.id
        );
    `);
  }
}

async function addPermission(permission: string, queryRunner: QueryRunner) {
  await queryRunner.query(`
      INSERT INTO "121-service".permission (name)
      SELECT '${permission}'
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service".permission WHERE name = '${permission}'
      );
    `);
}
