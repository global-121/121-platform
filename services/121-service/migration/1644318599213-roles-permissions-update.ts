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
    const permissionRepository = connection.getRepository(PermissionEntity);
    const permissions = await permissionRepository.find();

    const userRoleRepository = connection.getRepository(UserRoleEntity);
    const defaultRolesToUpdate = [
      {
        role: DefaultUserRole.RunProgram,
        label: 'Run Program',
        permissions: [
          // Took version from seed-init.ts as latest version, not the one from previous migration-script
          PermissionEnum.ActionCREATE,
          PermissionEnum.ActionREAD,
          // PermissionEnum.AidWorkerCREATE,  // REMOVED 2022-10-12
          // PermissionEnum.AidWorkerDELETE, Moved to admin
          PermissionEnum.AidWorkerProgramUPDATE,
          // PermissionEnum.InstanceUPDATE,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          // PermissionEnum.ProgramCREATE, Moved to admin
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.ProgramPhaseUPDATE,
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE, // Forgotten in seed-init / previous migration script
        ],
      },
      {
        role: DefaultUserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
        permissions: [
          // Took version from seed-init.ts as latest version, not the one from previous migration-script
          PermissionEnum.ActionCREATE,
          PermissionEnum.ActionREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentFspInstructionREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          // PermissionEnum.ProgramAllREAD, // REMOVED 2022-10-12
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationFspUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE, // Forgotten in seed-init / previous migration script
        ],
      },
    ];

    for (const defaultRole of defaultRolesToUpdate) {
      const defaultRoleEntity = await userRoleRepository.findOne({
        where: { role: defaultRole.role },
      });
      if (defaultRoleEntity) {
        defaultRoleEntity.permissions = permissions.filter(permission =>
          defaultRole.permissions.includes(permission.name),
        );
        await userRoleRepository.save(defaultRoleEntity);
      }
    }
  }
}
