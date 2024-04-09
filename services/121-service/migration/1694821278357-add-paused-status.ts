import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/enum/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';
import { UserRoleEntity } from '../src/user/user-role.entity';

export class addPausedStatus1694821278357 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    // 08-11-2022 migrateData() is commented out as this was causing issues with new entities and legacy migrations.
    await this.migrateData(queryRunner.manager);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }

  private async migrateData(manager: EntityManager): Promise<void> {
    // Add the new permission
    const permissionsRepository = manager.getRepository(PermissionEntity);
    const newPermission = 'registration:status:paused.update' as PermissionEnum;
    const permission = new PermissionEntity();
    permission.name = newPermission;
    let permissionEntity = await permissionsRepository.findOne({
      where: { name: newPermission },
    });
    if (!permissionEntity) {
      permissionEntity = await permissionsRepository.save(permission);
    }

    // Define closest permission to the new permission
    const closestPermission =
      'registration:status:included.update' as PermissionEnum;

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
