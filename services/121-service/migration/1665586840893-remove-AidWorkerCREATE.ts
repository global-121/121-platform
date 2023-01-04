import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';

export class removeAidWorkerCREATE1665586840893 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.commitTransaction();
    // 08-11-2022 migrateData() is commented out as this was causing issues with new entities and legacy migrations.
    // await this.migrateData(queryRunner.manager);
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(manager: EntityManager): Promise<void> {
    const permissionRepo = manager.getRepository(PermissionEntity);
    const permission = await permissionRepo.findOne({
      where: { name: 'aid-worker.create' as PermissionEnum },
      relations: ['roles'],
    });
    if (permission) {
      permission.roles = [];
      // Removes relations
      await permissionRepo.save(permission);
      await permissionRepo.delete({
        name: 'aid-worker.create' as PermissionEnum,
      });
    }
  }
}
