import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { PermissionEntity } from '@121-service/src/user/permissions.entity';
import { UserRoleEntity } from '@121-service/src/user/user-role.entity';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class removeRegistrationPersonalSEARCH1669718138929
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.manager);
    await queryRunner.startTransaction();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No down migration
  }

  private async migrateData(manager: EntityManager): Promise<void> {
    const userRoleRepo = manager.getRepository(UserRoleEntity);
    const permRepo = manager.getRepository(PermissionEntity);

    await permRepo
      .createQueryBuilder('permission')
      .select([`permission."id"`])
      .where(`permission.name = :permission`, {
        permission: 'registration:personal.search',
      })
      .getOne();
    const readPerm = await permRepo
      .createQueryBuilder('permission')
      .where(`permission.name = :permission`, {
        permission: 'registration:personal.read',
      })
      .getOne();

    const userRoles = await userRoleRepo
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .getMany();

    for (const userRole of userRoles) {
      const permissionNameArray = userRole.permissions.map((p) => p.name);
      const includesSearch = permissionNameArray.includes(
        'registration:personal.search' as PermissionEnum,
      );
      const includesRead = permissionNameArray.includes(
        'registration:personal.read' as PermissionEnum,
      );
      if (includesSearch && !includesRead) {
        userRole.permissions.push(readPerm!);
        await userRoleRepo.save(userRole);
      }
    }
    await this.removePermission('registration:personal.search', permRepo);
    await this.removePermission('registration:reference-id.search', permRepo);
  }

  private async removePermission(
    perminssionName,
    permissionRepo: any,
  ): Promise<void> {
    const permission = await permissionRepo.findOne({
      where: { name: perminssionName },
      relations: ['roles'],
    });
    if (permission) {
      permission.roles = [];
      // Removes relations
      await permissionRepo.save(permission);
      await permissionRepo.delete({
        name: perminssionName as PermissionEnum,
      });
    }
  }
}
