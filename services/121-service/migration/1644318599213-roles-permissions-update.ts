import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';
import { UserRoleEntity } from '../src/user/user-role.entity';
import { DefaultUserRole } from '../src/user/user-role.enum';

export class rolesPermissionsUpdate1644318599213 implements MigrationInterface {
  name = 'rolesPermissionsUpdate1644318599213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    // 08-11-2022 migrateData() is commented out as this was causing issues with new entities and legacy migrations.
    // await this.migrateData(queryRunner.manager);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(manager: EntityManager): Promise<void> {
    const permissionRepository = manager.getRepository(PermissionEntity);
    const permissions = await permissionRepository.find();

    const userRoleRepository = manager.getRepository(UserRoleEntity);
    const defaultRolesToUpdate = [
      {
        role: DefaultUserRole.ProgramAdmin,
        label: 'Program Admin',
        permissions: Object.values(PermissionEnum),
      },
      {
        role: DefaultUserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
        permissions: [
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.ActionREAD,
        ],
      },
    ];

    for (const defaultRole of defaultRolesToUpdate) {
      const defaultRoleEntity = await userRoleRepository.findOne({
        where: { role: defaultRole.role },
      });
      if (defaultRoleEntity) {
        defaultRoleEntity.permissions = permissions.filter((permission) =>
          defaultRole.permissions.includes(permission.name),
        );
        await userRoleRepository.save(defaultRoleEntity);
      }
    }
  }
}
