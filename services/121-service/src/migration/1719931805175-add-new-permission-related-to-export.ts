import { MigrationInterface, QueryRunner } from 'typeorm';

// New permission to add
// const newPermissions = [
//   'payment:voucher.export',
//   'registration:payment.export',
// ];

export class AddNewPermissionRelatedToExport1719931805175
  implements MigrationInterface
{
  name = 'AddNewPermissionRelatedToExport1719931805175';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Commenting out because this was causing issues with new entities and legacy migrations
    // and the migration is likely not needed anymore.
    // const userRoleRepository =
    //   queryRunner.manager.getRepository(UserRoleEntity);
    // const permissionsRepository =
    //   queryRunner.manager.getRepository(PermissionEntity);
    // for await (const newPermission of newPermissions) {
    //   const name = newPermission as PermissionEnum;
    //   const permission = new PermissionEntity();
    //   // Check if we already have this permission or not
    //   let permissionEntity = await permissionsRepository.findOne({
    //     where: { name: Equal(name) },
    //   });
    //   if (!permissionEntity) {
    //     permission.name = name;
    //     permissionEntity = await permissionsRepository.save(permission);
    //   }
    //   // Loop over all existing roles, to add the new permissions for everyone
    //   const userRoles = await userRoleRepository.find({
    //     relations: ['permissions'],
    //   });
    //   for await (const role of userRoles) {
    //     const rolePermissions = role.permissions.map(
    //       (p) => p.name as PermissionEnum,
    //     );
    //     if (!rolePermissions.includes(name)) {
    //       role.permissions.push(permissionEntity);
    //       await userRoleRepository.save(role);
    //     }
    //   }
    // }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Commenting out because this was causing issues with new entities and legacy migrations
    // and the migration is likely not needed anymore.
    // const userRoleRepository =
    //   queryRunner.manager.getRepository(UserRoleEntity);
    // const permissionsRepository =
    //   queryRunner.manager.getRepository(PermissionEntity);
    // for await (const oldPermission of newPermissions) {
    //   const name = oldPermission as PermissionEnum;
    //   // Find the permission entity
    //   const permissionEntity = await permissionsRepository.findOne({
    //     where: { name: Equal(name) },
    //   });
    //   if (permissionEntity) {
    //     // Loop over all existing roles, to remove the permissions
    //     const userRoles = await userRoleRepository.find({
    //       relations: ['permissions'],
    //     });
    //     for await (const role of userRoles) {
    //       role.permissions = role.permissions.filter(
    //         (permission) => permission.name !== name,
    //       );
    //       await userRoleRepository.save(role);
    //     }
    //     // Remove the actual permission entity
    //     await permissionsRepository.remove(permissionEntity);
    //   }
    // }
  }
}
