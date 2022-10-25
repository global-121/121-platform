import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';
import { UserRoleEntity } from '../src/user/user-role.entity';

export class processNewUserRolePermissions1644432255958
  implements MigrationInterface {
  name = 'processNewUserRolePermissions1644432255958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(connection: Connection): Promise<void> {
    // COMMENTED OUT THIS CODE AS THESE PERMISSION ARE MIGRATED TO ADMIN
    // // Define new permissions
    // const newPermissions = [
    //   PermissionEnum.RoleREAD,
    //   PermissionEnum.RoleUPDATE,
    //   PermissionEnum.RoleDELETE,
    // ];
    // // Define closest permission to the new permission
    // const closestPermission = PermissionEnum.RoleCREATE;
    // // Add the new permission
    // const permissionsRepository = connection.getRepository(PermissionEntity);
    // for await (const newPermission of newPermissions) {
    //   const permission = new PermissionEntity();
    //   permission.name = newPermission;
    //   let permissionEntity = await permissionsRepository.findOne({
    //     where: { name: newPermission },
    //   });
    //   if (!permissionEntity) {
    //     permissionEntity = await permissionsRepository.save(permission);
    //   }
    //   // Loop over all existing roles, if it has the closes permission, also add the new permission
    //   const userRoleRepository = connection.getRepository(UserRoleEntity);
    //   const userRoles = await userRoleRepository.find({
    //     relations: ['permissions'],
    //   });
    //   for (const role of userRoles) {
    //     const permissions = role.permissions.map(p => p.name as PermissionEnum);
    //     if (
    //       permissions.includes(closestPermission) &&
    //       !permissions.includes(newPermission)
    //     ) {
    //       role.permissions.push(permissionEntity);
    //       await userRoleRepository.save(role);
    //     }
    //   }
    // }
  }
}
