import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { DataSource } from 'typeorm';
import fspAfricasTalking from '../../seed-data/fsp/fsp-africas-talking.json';
import fspBank from '../../seed-data/fsp/fsp-bank.json';
import fspBelcash from '../../seed-data/fsp/fsp-belcash.json';
import fspBob from '../../seed-data/fsp/fsp-bob.json';
import fspCommercialBankEthiopia from '../../seed-data/fsp/fsp-commercial-bank-ethiopia.json';
import fspIntersolveJumboPhysical from '../../seed-data/fsp/fsp-intersolve-jumbo-physical.json';
import fspIntersolveVisa from '../../seed-data/fsp/fsp-intersolve-visa.json';
import fspIntersolveVoucherPaper from '../../seed-data/fsp/fsp-intersolve-voucher-paper.json';
import fspIntersolveVoucher from '../../seed-data/fsp/fsp-intersolve-voucher-whatsapp.json';
import fspMixedAttributes from '../../seed-data/fsp/fsp-mixed-attributes.json';
import fspNoAttributes from '../../seed-data/fsp/fsp-no-attributes.json';
import fspSafaricom from '../../seed-data/fsp/fsp-safaricom.json';
import fspUkrPoshta from '../../seed-data/fsp/fsp-ukrposhta.json';
import fspVodaCash from '../../seed-data/fsp/fsp-vodacash.json';
import { PermissionEnum } from '../user/permission.enum';
import { PermissionEntity } from '../user/permissions.entity';
import { UserRoleEntity } from '../user/user-role.entity';
import { DefaultUserRole } from '../user/user-role.enum';
import { UserType } from '../user/user-type-enum';
import { UserEntity } from '../user/user.entity';
import { InterfaceScript } from './scripts.module';
import { SeedHelper } from './seed-helper';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(private dataSource: DataSource) {}

  private readonly seedHelper = new SeedHelper(this.dataSource);

  public async run(isApiTests?: boolean): Promise<void> {
    if (isApiTests !== undefined && isApiTests.toString() === 'true') {
      await this.truncateAll();
    } else {
      await this.dropAll();
      await this.runAllMigrations();
    }
    const permissions = await this.addPermissions();
    await this.createDefaultRoles(permissions);
    await this.createAdminUser();
    await this.seedFsp();
  }

  private async addPermissions(): Promise<PermissionEntity[]> {
    const permissionsRepository =
      this.dataSource.getRepository(PermissionEntity);
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
    const userRoleRepository = this.dataSource.getRepository(UserRoleEntity);
    const defaultRoles = [
      {
        role: DefaultUserRole.ProgramAdmin,
        label: 'Program Admin',
        permissions: Object.values(PermissionEnum),
      },
      {
        role: DefaultUserRole.RunProgram,
        label: 'Run Program',
        permissions: [
          PermissionEnum.ActionCREATE,
          PermissionEnum.ActionREAD,
          // PermissionEnum.AidWorkerDELETE, Moved to admin
          PermissionEnum.AidWorkerProgramREAD,
          PermissionEnum.AidWorkerProgramUPDATE,
          // PermissionEnum.InstanceUPDATE,  // Admin-only
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.FspDebitCardUNBLOCK,
          PermissionEnum.FspDebitCardCREATE,
          PermissionEnum.FspDebitCardEXPORT,
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
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
        ],
      },
      {
        role: DefaultUserRole.View,
        label: 'Only view data, including Personally Identifiable Information',
        permissions: [
          PermissionEnum.ActionREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationREAD,
        ],
      },
      {
        role: DefaultUserRole.PersonalData,
        label: 'Handle Personally Identifiable Information',
        permissions: [
          PermissionEnum.ActionCREATE,
          PermissionEnum.ActionREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentFspInstructionREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.FspDebitCardUNBLOCK,
          PermissionEnum.FspDebitCardCREATE,
          PermissionEnum.FspDebitCardEXPORT,
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
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
        ],
      },
      {
        role: DefaultUserRole.FieldValidation,
        label: 'Do Field Validation',
        permissions: [
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationFspREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationPersonalREAD,
        ],
      },
      {
        role: DefaultUserRole.KoboUser,
        label: 'Only CREATE registrations',
        permissions: [PermissionEnum.RegistrationCREATE],
      },
      {
        role: DefaultUserRole.CvaManager,
        label: 'Cash Assistance Program Manager',
        permissions: [
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramPhaseUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.FspDebitCardUNBLOCK,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationDELETE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.AidWorkerProgramREAD,
          PermissionEnum.AidWorkerProgramUPDATE,
          PermissionEnum.RegistrationStatusPausedUPDATE,
        ],
      },
      {
        role: DefaultUserRole.CvaOfficer,
        label: 'Cash Assistance Program Officer',
        permissions: [
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalForValidationREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusSelectedForValidationUPDATE,
          PermissionEnum.RegistrationStatusNoLongerEligibleUPDATE,
          PermissionEnum.RegistrationStatusRejectedUPDATE,
          PermissionEnum.RegistrationStatusInclusionEndedUPDATE,
          PermissionEnum.RegistrationStatusInvitedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.ActionREAD,
          PermissionEnum.RegistrationStatusPausedUPDATE,
        ],
      },
      {
        role: DefaultUserRole.FinanceManager,
        label: 'Finance Manager',
        permissions: [
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.FspDebitCardUNBLOCK,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.ActionREAD,
        ],
      },
      {
        role: DefaultUserRole.FinanceOfficer,
        label: 'Finance Officer',
        permissions: [
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.FspDebitCardUNBLOCK,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.ActionREAD,
        ],
      },
    ];

    const userRoleEntities = [];
    for (const defaultRole of defaultRoles) {
      const defaultRoleEntity = new UserRoleEntity();
      defaultRoleEntity.role = defaultRole.role;
      defaultRoleEntity.label = defaultRole.label;
      defaultRoleEntity.permissions = permissions.filter((permission) =>
        defaultRole.permissions.includes(permission.name),
      );
      userRoleEntities.push(await userRoleRepository.save(defaultRoleEntity));
    }
    return userRoleEntities;
  }

  private async createAdminUser(): Promise<void> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    await userRepository.save({
      username: process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: crypto
        .createHmac('sha256', process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN)
        .digest('hex'),
      userType: UserType.aidWorker,
      admin: true,
    });
  }

  public async dropAll(): Promise<void> {
    const dropTableQueries = await this.dataSource.manager
      .query(`select 'drop table if exists "121-service"."' || tablename || '" cascade;'
        from pg_tables
        where schemaname = '121-service'
        and tablename not in ('custom_migration_table');`);
    for (const q of dropTableQueries) {
      for (const key in q) {
        await this.dataSource.manager.query(q[key]);
      }
    }
  }

  public async truncateAll(): Promise<void> {
    const tablesToTruncate = await this.dataSource.manager.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = '121-service'
      AND tablename NOT IN ('custom_migration_table');
  `);

    for (const table of tablesToTruncate) {
      const tableName = table.tablename;
      try {
        await this.dataSource.manager.query(`
        TRUNCATE TABLE "121-service"."${tableName}" CASCADE;
      `);

        const sequenceName = `${tableName}_id_seq`;
        const sequenceExists = await this.sequenceExists(sequenceName);

        if (sequenceExists) {
          await this.dataSource.manager.query(`
          ALTER SEQUENCE "121-service"."${sequenceName}" RESTART WITH 1;
        `);
        }
      } catch (error) {
        console.error(`Error truncating table "${tableName}":`, error);
      }
    }
  }

  private async sequenceExists(sequenceName: string): Promise<boolean> {
    const result = await this.dataSource.manager.query(`
    SELECT EXISTS (
      SELECT 1
      FROM pg_sequences
      WHERE schemaname = '121-service'
        AND sequencename = '${sequenceName}'
    );
  `);

    return result[0].exists;
  }

  private async runAllMigrations(): Promise<void> {
    await this.dataSource.query(
      'TRUNCATE TABLE "121-service"."custom_migration_table"',
    );
    await this.dataSource.runMigrations({
      transaction: 'all',
    });
  }

  private async seedFsp(): Promise<void> {
    await this.seedHelper.addFsp(fspIntersolveVoucher);
    await this.seedHelper.addFsp(fspIntersolveVoucherPaper);
    await this.seedHelper.addFsp(fspIntersolveVisa);
    await this.seedHelper.addFsp(fspIntersolveJumboPhysical);
    await this.seedHelper.addFsp(fspAfricasTalking);
    await this.seedHelper.addFsp(fspVodaCash);
    await this.seedHelper.addFsp(fspBob);
    await this.seedHelper.addFsp(fspBelcash);
    await this.seedHelper.addFsp(fspBank);
    await this.seedHelper.addFsp(fspMixedAttributes);
    await this.seedHelper.addFsp(fspNoAttributes);
    await this.seedHelper.addFsp(fspUkrPoshta);
    await this.seedHelper.addFsp(fspSafaricom);
    await this.seedHelper.addFsp(fspCommercialBankEthiopia);
  }
}

export default SeedInit;
