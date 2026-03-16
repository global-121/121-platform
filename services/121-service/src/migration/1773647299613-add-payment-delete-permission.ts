import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentDeletePermission1773647299613 implements MigrationInterface {
  name = 'AddPaymentDeletePermission1773647299613';
  closestPermissionName = 'payment.create';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new permission if it doesn't exist
    await queryRunner.query(`
      INSERT INTO "121-service".permission (name)
      SELECT 'payment.delete'
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service".permission WHERE name = 'payment.delete'
      );
    `);

    // Get role ids that have the payment.create permission
    const rolesWithClosestPermission: { userRoleId: number }[] =
      await queryRunner.query(`
      SELECT urp."userRoleId"
      FROM "121-service".user_role_permissions_permission urp
      JOIN "121-service".permission p ON urp."permissionId" = p.id
      WHERE p.name = 'payment.create';
    `);

    // Assign the new permission to those roles
    for (const role of rolesWithClosestPermission) {
      await queryRunner.query(`
      INSERT INTO "121-service".user_role_permissions_permission ("userRoleId", "permissionId")
      SELECT ${role.userRoleId}, p.id
      FROM "121-service".permission p
      WHERE p.name = 'payment.delete'
        AND NOT EXISTS (
          SELECT 1 FROM "121-service".user_role_permissions_permission urp
          WHERE urp."userRoleId" = ${role.userRoleId} AND urp."permissionId" = p.id
        );
    `);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
