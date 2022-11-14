import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';
import { UserRoleEntity } from '../src/user/user-role.entity';

export class processNewCustomAttributePermission1644332255958
  implements MigrationInterface {
  name = 'processNewCustomAttributePermission1644332255958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    // 08-11-2022 migrateData() is commented out as this was causing issues with new entities and legacy migrations.
    // await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(connection: Connection): Promise<void> {
    // Add the new permission
    const permissionsRepository = connection.getRepository(PermissionEntity);
    const newPermission = PermissionEnum.ProgramCustomAttributeUPDATE;
    const permission = new PermissionEntity();
    permission.name = newPermission;
    let permissionEntity = await permissionsRepository.findOne({
      where: { name: newPermission },
    });
    if (!permissionEntity) {
      permissionEntity = await permissionsRepository.save(permission);
    }

    // Define closest permission to the new permission
    const closestPermission = PermissionEnum.ProgramQuestionUPDATE;

    // Loop over all existing roles, if it has the closes permission, also add the new permission
    const userRoleRepository = connection.getRepository(UserRoleEntity);
    const userRoles = await userRoleRepository.find({
      relations: ['permissions'],
    });
    for (const role of userRoles) {
      const permissions = role.permissions.map(p => p.name as PermissionEnum);
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
