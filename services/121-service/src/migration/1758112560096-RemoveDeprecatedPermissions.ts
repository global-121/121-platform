import { MigrationInterface, QueryRunner } from 'typeorm';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export class RemoveDeprecatedPermissions1758112560096
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.migrateData(queryRunner);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }

  private async migrateData(queryRunner: QueryRunner): Promise<void> {
    const existingPermissions = await queryRunner.query(`
      SELECT id,name FROM "121-service".permission
    `);
    console.log('Total existing permissions: ', existingPermissions.length);

    const validPermissionValues = Object.values(PermissionEnum);
    const deprecatedPermissions = existingPermissions.filter(
      (permission) =>
        !validPermissionValues.includes(permission.name as PermissionEnum),
    );

    if (deprecatedPermissions.length === 0) {
      console.log('No deprecated permissions found');
      return;
    }

    console.log('Deprecated permissions to remove: ', deprecatedPermissions);

    // First, delete related records that reference these permissions
    await queryRunner.query(
      `
      DELETE FROM "121-service".user_role_permissions_permission
      WHERE "permissionId" = ANY($1)
    `,
      [deprecatedPermissions.map((p) => p.id)],
    );

    // Remove deprecated permissions using parameterized query
    await queryRunner.query(
      `
      DELETE FROM "121-service".permission
      WHERE id = ANY($1)
    `,
      [deprecatedPermissions.map((p) => p.id)],
    );

    console.log(
      `Successfully removed ${deprecatedPermissions.length} deprecated permissions`,
    );
  }
}
