import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentDeletePermission1773647299613 implements MigrationInterface {
  name = 'AddPaymentDeletePermission1773647299613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new permission if it doesn't exist
    await queryRunner.query(`
      INSERT INTO "121-service".permission (name)
      SELECT 'payment.delete'
      WHERE NOT EXISTS (
        SELECT 1 FROM "121-service".permission WHERE name = 'payment.delete'
      );
    `);

    // Assign the new permission to all roles that have the payment.create permission
    await queryRunner.query(`
      INSERT INTO "121-service".user_role_permissions_permission ("userRoleId", "permissionId")
      SELECT DISTINCT urp."userRoleId", p_delete.id
      FROM "121-service".user_role_permissions_permission urp
      JOIN "121-service".permission p_create
        ON urp."permissionId" = p_create.id
      JOIN "121-service".permission p_delete
        ON p_delete.name = 'payment.delete'
      WHERE p_create.name = 'payment.create'
        AND NOT EXISTS (
          SELECT 1
          FROM "121-service".user_role_permissions_permission urp_existing
          WHERE urp_existing."userRoleId" = urp."userRoleId"
            AND urp_existing."permissionId" = p_delete.id
        );
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }
}
