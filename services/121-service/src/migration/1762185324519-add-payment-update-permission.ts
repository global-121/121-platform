import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentUpdatePermission1762185324519
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new permission if it doesn't exist
    await queryRunner.query(`
      INSERT INTO "121-service".permission (name)
      SELECT 'payment.update'
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service".permission WHERE name = 'payment.update'
      );
    `);

    // Add the new permission to finance-manager role (and admin)
    await queryRunner.query(`
      INSERT INTO "121-service".user_role_permissions_permission ("userRoleId", "permissionId")
      SELECT ur.id, p.id
      FROM "121-service".user_role ur, "121-service".permission p
      WHERE ur.role IN ('finance-manager', 'admin')
        AND p.name = 'payment.update'
        AND NOT EXISTS (
          SELECT 1 FROM "121-service".user_role_permissions_permission urp
          WHERE urp."userRoleId" = ur.id AND urp."permissionId" = p.id
        );
    `);

    // Add payment.create permission to cva-manager and program-admin roles (and admin) if not present
    await queryRunner.query(`
      INSERT INTO "121-service".user_role_permissions_permission ("userRoleId", "permissionId")
      SELECT ur.id, p.id
      FROM "121-service".user_role ur, "121-service".permission p
      WHERE ur.role IN ('cva-manager', 'program-admin', 'admin')
        AND p.name = 'payment.create'
        AND NOT EXISTS (
          SELECT 1 FROM "121-service".user_role_permissions_permission urp
          WHERE urp."userRoleId" = ur.id AND urp."permissionId" = p.id
        );
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No need to remove the permission on down migration
  }
}
