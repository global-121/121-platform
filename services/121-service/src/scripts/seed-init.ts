import { DefaultUserRole } from '../user/user-role.enum';
import { Injectable } from '@nestjs/common';
import { InterfaceScript } from './scripts.module';
import { Connection } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import crypto from 'crypto';
import { UserRoleEntity } from '../user/user-role.entity';
import { UserType } from '../user/user-type-enum';
import { PermissionEnum } from '../user/permission.enum';
import { PermissionEntity } from '../user/permissions.entity';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private connection: Connection) {}

  public async run(): Promise<void> {
    await this.dropAll();
    await this.runAllMigrations();
    const permissions = await this.addPermissions();
    await this.createDefaultRoles(permissions);
    await this.createAdminUser();
  }

  private async addPermissions(): Promise<PermissionEntity[]> {
    const permissionsRepository = this.connection.getRepository(
      PermissionEntity,
    );
    const permissionEntities = [];
    for (const permissionName of Object.values(PermissionEnum)) {
      let permissionEntity = await permissionsRepository.findOne({
        where: { name: permissionName },
      });
      if (!permissionEntity) {
        const permission = new PermissionEntity();
        permission.name = permissionName as PermissionEnum;
        permissionEntity = await permissionsRepository.save(permission);
      }
      permissionEntities.push(permissionEntity);
    }
    return permissionEntities;
  }

  private async createDefaultRoles(
    permissions: PermissionEntity[],
  ): Promise<UserRoleEntity[]> {
    const userRoleRepository = this.connection.getRepository(UserRoleEntity);
    const defaultRoles = [
      {
        role: DefaultUserRole.Admin,
        label: 'Admin',
        permissions: Object.values(PermissionEnum),
      },
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
          PermissionEnum.RegistratonNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.AidWorkerCREATE,
          PermissionEnum.AidWorkerDELETE,
          PermissionEnum.AidWorkerProgramUPDATE,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
        ],
      },
      {
        role: DefaultUserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
        permissions: [
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.ActionREAD,
        ],
      },
      {
        role: DefaultUserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
        permissions: [
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
          PermissionEnum.RegistratonNotificationREAD,
          PermissionEnum.RegistratonNotificationCREATE,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.ActionCREATE,
        ],
      },
      {
        role: DefaultUserRole.FieldValidation,
        label: 'Do Field Validation',
        permissions: [
          PermissionEnum.RegistrationReferenceIdSEARCH,
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalSEARCH,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationAttributeUPDATE,
        ],
      },
    ];

    const userRoleEntities = [];
    for (const defaultRole of defaultRoles) {
      const defaultRoleEntity = new UserRoleEntity();
      defaultRoleEntity.role = defaultRole.role;
      defaultRoleEntity.label = defaultRole.label;
      defaultRoleEntity.permissions = permissions.filter(permission =>
        defaultRole.permissions.includes(permission.name),
      );
      userRoleEntities.push(await userRoleRepository.save(defaultRoleEntity));
    }
    return userRoleEntities;
  }

  private async createAdminUser(): Promise<void> {
    const userRepository = this.connection.getRepository(UserEntity);
    await userRepository.save({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: crypto
        .createHmac('sha256', process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN)
        .digest('hex'),
      userType: UserType.aidWorker,
    });
  }

  public async dropAll(): Promise<void> {
    const entities = this.connection.entityMetadatas;
    try {
      for (const entity of entities) {
        const repository = await this.connection.getRepository(entity.name);
        if (repository.metadata.schema === '121-service') {
          const q = `DROP TABLE \"${repository.metadata.schema}\".\"${entity.tableName}\" CASCADE;`;
          await repository.query(q);
        }
      }
    } catch (error) {
      throw new Error(`ERROR: Cleaning test db: ${error}`);
    }
  }

  private async runAllMigrations(): Promise<void> {
    await this.connection.query(
      'TRUNCATE TABLE "121-service"."custom_migration_table"',
    );
    await this.connection.runMigrations({
      transaction: 'all',
    });
  }
}

export default SeedInit;
