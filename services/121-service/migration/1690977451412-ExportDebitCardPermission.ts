import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';

export class ExportDebitCardPermission1690977451412
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.manager);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(manager: EntityManager): Promise<void> {
    // Add the new permission
    const permissionsRepository = manager.getRepository(PermissionEntity);
    const newPermission = PermissionEnum.FspDebitCardEXPORT;
    const permission = new PermissionEntity();
    permission.name = newPermission;
    let permissionEntity = await permissionsRepository.findOne({
      where: { name: newPermission },
    });
    if (!permissionEntity) {
      permissionEntity = await permissionsRepository.save(permission);
    }
  }
}
