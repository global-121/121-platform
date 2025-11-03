import { EntityManager, Equal, MigrationInterface, QueryRunner } from 'typeorm';

import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

export class AddPaymentUpdatePermission1762185324519
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.manager);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No need to remove the permission on down migration
  }

  private async migrateData(manager: EntityManager): Promise<void> {
    // Add the new permission
    const permissionsRepository = manager.getRepository(PermissionEntity);
    const newPermission = 'payment.update' as PermissionEnum;
    const permission = new PermissionEntity();
    permission.name = newPermission;
    let permissionEntity = await permissionsRepository.findOne({
      where: { name: Equal(newPermission) },
    });
    if (!permissionEntity) {
      permissionEntity = await permissionsRepository.save(permission);
    }

    // Add the new permission to default role 'finance-manager'
    // NOTE: agreed to not add to any roles which currently have 'payment.create'. This will be done manually.
    const userRoleRepository = manager.getRepository(UserRoleEntity);
    const userRoles = await userRoleRepository.find({
      relations: ['permissions'],
    });
    const financeManagerRole = userRoles.find(
      (role) => role.role === 'finance-manager',
    );
    if (financeManagerRole) {
      financeManagerRole.permissions.push(permissionEntity);
      await userRoleRepository.save(financeManagerRole);
    }

    // Add the payment.create permission to default role 'cva-manager'
    const cvaManagerRole = userRoles.find(
      (role) => role.role === 'cva-manager',
    );
    const paymentCreatePermission = 'payment.create' as PermissionEnum;
    const paymentCreatePermissionEntity =
      await permissionsRepository.findOneOrFail({
        where: { name: Equal(paymentCreatePermission) },
      });

    if (cvaManagerRole) {
      const hasPermission = cvaManagerRole.permissions.some(
        (p) => p.name === paymentCreatePermission,
      );
      if (!hasPermission) {
        cvaManagerRole.permissions.push(paymentCreatePermissionEntity);
        await userRoleRepository.save(cvaManagerRole);
      }
    }
  }
}
