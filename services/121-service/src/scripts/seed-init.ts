import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { DataSource, Equal } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { PermissionEntity } from '@121-service/src/user/entities/permissions.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserRoleEntity } from '@121-service/src/user/entities/user-role.entity';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { DefaultUserRole } from '@121-service/src/user/enum/user-role.enum';
import { UserType } from '@121-service/src/user/enum/user-type-enum';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(
    private dataSource: DataSource,
    private readonly queuesService: QueuesRegistryService,
    private readonly httpService: CustomHttpService,
  ) {}

  public async run(isApiTests = false): Promise<void> {
    await this.clearCallbacksMockService();
    if (IS_DEVELOPMENT) {
      await this.queuesService.emptyAllQueues();
    }
    if (isApiTests) {
      // Only truncate tables when running the API tests, since API Tests are run asynchronously, it may run into a situation where the migrations are still running and a table does not exist yet
      await this.truncateAll();
    } else {
      // Drop all tables in all other cases (i.e. when not running API Tests), since that creates a clean slate after switching branches.
      await this.dropAll();
      await this.runAllMigrations();
      // Some migration scripts contain data migrations (i.e. add data), so delete all data before seeding as well.
      await this.truncateAll();
    }
    const permissions = await this.addPermissions();
    await this.createDefaultRoles(permissions);
    await this.createAdminUser();
  }

  private async clearCallbacksMockService(): Promise<void> {
    if (IS_DEVELOPMENT) {
      await this.httpService.get(`${env.MOCK_SERVICE_URL}/api/reset/callbacks`);
    }
  }

  private async addPermissions(): Promise<PermissionEntity[]> {
    const permissionsRepository =
      this.dataSource.getRepository(PermissionEntity);
    const permissionEntities: PermissionEntity[] = [];
    for (const permissionName of Object.values(PermissionEnum)) {
      let permissionEntity = await permissionsRepository.findOne({
        where: { name: Equal(permissionName) },
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
        role: DefaultUserRole.Admin,
        label: 'Admin',
        permissions: Object.values(PermissionEnum),
      },
      {
        role: DefaultUserRole.ProgramAdmin,
        label: 'Program Admin',
        permissions: Object.values(PermissionEnum).filter(
          (p) => p !== PermissionEnum.PaymentUPDATE,
        ),
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
          PermissionEnum.ProgramAttachmentsREAD,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationREAD,
        ],
      },
      {
        role: DefaultUserRole.KoboRegistrationUser,
        label: 'Only CREATE registrations',
        permissions: [PermissionEnum.RegistrationCREATE],
      },
      {
        role: DefaultUserRole.KoboValidationUser,
        label: 'Only UPDATE registrations',
        permissions: [
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationAttributeFinancialUPDATE,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusMarkAsValidatedUPDATE,
        ],
      },
      {
        role: DefaultUserRole.CvaManager,
        label: 'Cash Assistance Program Manager',
        permissions: [
          PermissionEnum.ProgramUPDATE,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.ProgramAttachmentsREAD,
          PermissionEnum.ProgramAttachmentsCREATE,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.FspDebitCardUNBLOCK,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationCREATE,
          PermissionEnum.RegistrationAttributeUPDATE,
          PermissionEnum.RegistrationAttributeFinancialUPDATE,
          PermissionEnum.RegistrationNotificationCREATE,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPersonalEXPORT,
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusMarkAsValidatedUPDATE,
          PermissionEnum.RegistrationStatusMarkAsDeclinedUPDATE,
          PermissionEnum.RegistrationStatusIncludedUPDATE,
          PermissionEnum.RegistrationImportTemplateREAD,
          PermissionEnum.RegistrationDuplicationDELETE,
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
          PermissionEnum.ProgramAttachmentsREAD,
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
          PermissionEnum.RegistrationPersonalUPDATE,
          PermissionEnum.RegistrationStatusMarkAsValidatedUPDATE,
          PermissionEnum.RegistrationStatusMarkAsDeclinedUPDATE,
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
          PermissionEnum.ProgramAttachmentsREAD,
          PermissionEnum.ProgramAttachmentsCREATE,
          PermissionEnum.PaymentCREATE,
          PermissionEnum.PaymentUPDATE,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentFspInstructionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.FspDebitCardBLOCK,
          PermissionEnum.FspDebitCardUNBLOCK,
          PermissionEnum.RegistrationREAD,
          PermissionEnum.RegistrationPersonalREAD,
          PermissionEnum.RegistrationPaymentExport,
          PermissionEnum.ActionREAD,
        ],
      },
      {
        role: DefaultUserRole.FinanceOfficer,
        label: 'Finance Officer',
        permissions: [
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.ProgramAttachmentsREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentFspInstructionREAD,
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
        role: DefaultUserRole.ViewWithoutPII,
        label:
          'Only view data, not including Personally Identifiable Information',
        permissions: [
          PermissionEnum.ActionREAD,
          PermissionEnum.PaymentREAD,
          PermissionEnum.PaymentTransactionREAD,
          PermissionEnum.PaymentVoucherREAD,
          PermissionEnum.FspDebitCardREAD,
          PermissionEnum.ProgramMetricsREAD,
          PermissionEnum.RegistrationNotificationREAD,
          PermissionEnum.RegistrationREAD,
        ],
      },
    ];

    const userRoleEntities: UserRoleEntity[] = [];
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
      username: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      password: crypto
        .createHmac('sha256', env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN)
        .digest('hex'),
      userType: UserType.aidWorker,
      admin: true,
      isOrganizationAdmin: true,
      displayName: env.USERCONFIG_121_SERVICE_EMAIL_ADMIN.split('@')[0],
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
}
