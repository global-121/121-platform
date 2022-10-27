import { UserEntity } from './../src/user/user.entity';
import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';

export class migratePermissionsToAdmin1666098887955
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(connection: Connection): Promise<void> {
    const userRepo = connection.getRepository(UserEntity);
    const users = await userRepo.find({
      relations: ['programAssignments', 'programAssignments.roles'],
    });

    for (const u of users) {
      let isAdmin = false;
      for (const a of u.programAssignments) {
        for (const r of a.roles) {
          // Do no use enum in case it later on changes
          if (r.role === 'admin') {
            isAdmin = true;
          }
        }
      }
      if (isAdmin) {
        u.admin = true;
        await userRepo.save(u);
      }
    }

    const permissionRepo = connection.getRepository(PermissionEntity);
    const permissions = [
      'program:all.read',
      'program.create',
      'fsp.update',
      'payment:voucher:instruction.update',
      'instance.update',
      'fsp:attribute.update',
      'fsp:attribute.create',
      'fsp:attribute.delete',
      'aid-worker.delete',
      'role.read',
      'role.create',
      'role.update',
      'role.delete',
      'test',
    ];
    for (const p of permissions) {
      await this.removePermission(p, permissionRepo);
    }
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
