import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminRoleProgramPermissions1781683200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Define all permissions to add
    const permissions = [
      'program:approval-thresholds.read',
      'program:approval-thresholds.update',
      'program:fsp-config.read',
      'program:fsp-config.create',
      'program:fsp-config.update',
      'program:fsp-config.delete',
      'program:registration-attributes.create',
      'program:registration-attributes.update',
      'program:registration-attributes.delete',
      'program:kobo.read',
      'program:kobo.update',
    ];

    for (const permissionName of permissions) {
      // Insert permission if it doesn't exist
      await queryRunner.query(
        `
        INSERT INTO "121-service".permission (name)
        SELECT $1::VARCHAR
        WHERE NOT EXISTS (
          SELECT 1 FROM "121-service".permission WHERE name = $1
        );
      `,
        [permissionName],
      );

      // Add permission to admin role
      await queryRunner.query(
        `
        INSERT INTO "121-service".user_role_permissions_permission ("userRoleId", "permissionId")
        SELECT ur.id, p.id
        FROM "121-service".user_role ur, "121-service".permission p
        WHERE ur.role = 'admin'
          AND p.name = $1
          AND NOT EXISTS (
            SELECT 1 FROM "121-service".user_role_permissions_permission urp
            WHERE urp."userRoleId" = ur.id AND urp."permissionId" = p.id
          );
      `,
        [permissionName],
      );
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    throw new Error('Down migrations are not required.');
  }
}
