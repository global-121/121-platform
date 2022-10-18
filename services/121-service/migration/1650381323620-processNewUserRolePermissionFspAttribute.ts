import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';
import { UserRoleEntity } from '../src/user/user-role.entity';

export class processNewUserRolePermissionFspAttribute1650381323620
  implements MigrationInterface {
  name = 'processNewUserRolePermissionFspAttribute1650381323620';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
  private async migrateData(connection: Connection): Promise<void> {
    // COMMENTED OUT THIS CODE BECAUSE THESE PERMISSIONS HAVE BEEN MOVED TO ADMIN
    // // Define new permissions
    // const newPermissions = [
    //   // PermissionEnum.FspAttributeCREATE,
    //   // PermissionEnum.FspAttributeDELETE, // AdminOnly
    // ];
    // // Define closest permission to the new permission
    // const closestPermission = PermissionEnum.FspAttributeUPDATE;
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
