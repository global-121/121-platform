import { Injectable } from '@nestjs/common';
import crypto from 'node:crypto';
import { DataSource, QueryFailedError } from 'typeorm';

import { IS_DEVELOPMENT } from '@121-service/src/config';
import { env } from '@121-service/src/env';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { InterfaceScript } from '@121-service/src/scripts/scripts.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { PermissionMaintenanceService } from '@121-service/src/shared/services/permission-maintenance.service';
import { UserEntity } from '@121-service/src/user/entities/user.entity';
import { UserType } from '@121-service/src/user/enum/user-type-enum';
import { waitFor } from '@121-service/src/utils/waitFor.helper';

@Injectable()
export class SeedInit implements InterfaceScript {
  public constructor(
    private dataSource: DataSource,
    private readonly queuesService: QueuesRegistryService,
    private readonly httpService: CustomHttpService,
    private readonly permissionMaintenanceService: PermissionMaintenanceService,
  ) {}

  public async run({
    isApiTests = false,
  }: {
    isApiTests?: boolean;
  }): Promise<void> {
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
    await this.permissionMaintenanceService.syncSupportedPermissions();
    await this.permissionMaintenanceService.syncDefaultRoles();
    await this.createAdminUser();
  }

  private async clearCallbacksMockService(): Promise<void> {
    if (IS_DEVELOPMENT) {
      await this.httpService.get(`${env.MOCK_SERVICE_URL}/api/reset/callbacks`);
    }
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
    const tablesToTruncate: { tablename: string }[] = await this.dataSource
      .manager.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = '121-service'
          AND tablename NOT IN ('custom_migration_table');
      `);

    if (tablesToTruncate.length === 0) {
      // This should not happen, so let's be defensive.
      throw new Error('No tables found to truncate.');
    }

    const tableNames = tablesToTruncate
      .map((t) => `"121-service"."${t.tablename}"`)
      .join(', ');

    // Truncate all tables in a single statement
    // RESTART IDENTITY automatically resets all associated sequences
    await this.runRetryingOnDeadlock({
      query: `TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`,
    });
  }

  // Jobs that are still active during a reset can deadlock with the TRUNCATE; Postgres aborts one side, so retrying is safe.
  private async runRetryingOnDeadlock({
    query,
  }: {
    query: string;
  }): Promise<void> {
    const truncateMaxAttempts = 5;
    const truncateInitialRetryDelayInMs = 250;
    for (let attempt = 1; ; attempt++) {
      try {
        await this.dataSource.manager.query(query);
        return;
      } catch (error) {
        if (
          !this.isDeadlockError({ error }) ||
          attempt >= truncateMaxAttempts
        ) {
          throw error;
        }
        await waitFor(truncateInitialRetryDelayInMs * 2 ** (attempt - 1));
      }
    }
  }

  private isDeadlockError({ error }: { error: unknown }): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const postgresDeadlockErrorCode = '40P01';
    const driverError: { code?: string } = error.driverError;
    return driverError.code === postgresDeadlockErrorCode;
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
