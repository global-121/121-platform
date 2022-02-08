import { Connection, MigrationInterface, QueryRunner } from 'typeorm';
import { PermissionEnum } from '../src/user/permission.enum';
import { PermissionEntity } from '../src/user/permissions.entity';
import { UserRoleEntity } from '../src/user/user-role.entity';
import { DefaultUserRole } from '../src/user/user-role.enum';

export class rolesPermissionsUpdate1644318599213 implements MigrationInterface {
  name = 'rolesPermissionsUpdate1644318599213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Commit transaction because the tables are needed before the insert
    await queryRunner.commitTransaction();
    await this.migrateData(queryRunner.connection);
    // Start artifical transaction because typeorm migrations automatically tries to close a transcation after migration
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}

  private async migrateData(connection: Connection): Promise<void> {
    const permissions = [];
    for (const permissionName of Object.values(PermissionEnum)) {
      const permission = new PermissionEntity();
      permission.name = permissionName as PermissionEnum;
      permissions.push(permission);
    }

    const userRoleRepository = connection.getRepository(UserRoleEntity);

    const defaultRolesToUpdate = [
      {
        role: DefaultUserRole.RunProgram,
        label: 'Run Program',
        permissions: [
          PermissionEnum.InstanceUPDATE,
          PermissionEnum.ProgramCREATE,
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramAllREAD,
          PermissionEnum.ProgramPhaseUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE, // Forgotten in previous migration script
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.AidWorkerCREATE,
          PermissionEnum.AidWorkerDELETE,
          PermissionEnum.AidWorkerProgramUPDATE,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
        ],
      },
      {
        role: DefaultUserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
        permissions: [
          PermissionEnum.ProgramAllREAD,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentFspInstructionREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE, // Forgotten in previous migration script
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
        ],
      },
    ];

    for (const defaultRole of defaultRolesToUpdate) {
      const defaultRoleEntity = await userRoleRepository.findOne({
        where: { role: defaultRole.role },
      });
      if (!defaultRoleEntity) {
        continue;
      }
      defaultRoleEntity.role = defaultRole.role;
      defaultRoleEntity.label = defaultRole.label;
      defaultRoleEntity.permissions = permissions.filter(permission =>
        defaultRole.permissions.includes(permission.name),
      );
      await userRoleRepository.save(defaultRoleEntity);
    }
  }
}
