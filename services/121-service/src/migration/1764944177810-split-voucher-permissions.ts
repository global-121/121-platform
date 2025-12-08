import { EntityManager, Equal, MigrationInterface, QueryRunner } from 'typeorm';

import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export class SplitVoucherPermissions1764944177810
  implements MigrationInterface
{
  name = 'SplitVoucherPermissions1764944177810';
  closestPermissionName = 'payment:voucher.read';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();

    // Add the new paper permission
    await this.addNewPermission({
      manager: queryRunner.manager,
      newPermissionName: 'payment:voucher-paper.read',
    });

    // Add the new paper permission
    await this.addNewPermission({
      manager: queryRunner.manager,
      newPermissionName: 'payment:voucher-whatsapp.read',
    });

    await queryRunner.commitTransaction();

    // Get old permission ID and delete it from roles and permissions
    const closestPermissionIdQuery: { id; number }[] = await queryRunner.query(`
      SELECT "id" FROM "121-service".permission
      WHERE "name" = '${this.closestPermissionName}'
      `);

    if (closestPermissionIdQuery.length === 0) {
      return;
    }

    const closestPermissionId = closestPermissionIdQuery[0].id;

    await queryRunner.query(`
      DELETE FROM "121-service".user_role_permissions_permission
      WHERE "permissionId" = ${closestPermissionId}
      `);

    await queryRunner.query(`
      DELETE FROM "121-service".permission
      WHERE "id" = ${closestPermissionId}
      `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }

  private async addNewPermission({
    manager,
    newPermissionName,
  }: {
    manager: EntityManager;
    newPermissionName: string;
  }): Promise<void> {
    const permissionsRepository = manager.getRepository(PermissionEntity);
    const newPermission = newPermissionName as PermissionEnum;
    const permission = new PermissionEntity();
    permission.name = newPermission;
    let permissionEntity = await permissionsRepository.findOne({
      where: { name: Equal(newPermission) },
    });
    if (!permissionEntity) {
      permissionEntity = await permissionsRepository.save(permission);
    }

    // Define closest permission to the new permission
    const closestPermission = this.closestPermissionName as PermissionEnum;

    // Loop over all existing roles, if it has the closes permission, also add the new permission
    const userRoleRepository = manager.getRepository(UserRoleEntity);
    const userRoles = await userRoleRepository.find({
      relations: ['permissions'],
    });
    for (const role of userRoles) {
      const permissions = role.permissions.map((p) => p.name as PermissionEnum);
      if (
        permissions.includes(closestPermission) &&
        !permissions.includes(newPermission)
      ) {
        role.permissions.push(permissionEntity);
        await userRoleRepository.save(role);
      }
    }
  }
}
