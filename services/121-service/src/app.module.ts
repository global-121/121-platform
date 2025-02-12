import { BullModule } from '@nestjs/bull';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule as TypeORMNestJS } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ActivitiesModule } from '@121-service/src/activities/activities.module';
import { AppController } from '@121-service/src/app.controller';
import { AuthModule } from '@121-service/src/auth/auth.module';
import { THROTTLING_LIMIT_GENERIC } from '@121-service/src/config';
import { CronjobModule } from '@121-service/src/cronjob/cronjob.module';
import { EmailsModule } from '@121-service/src/emails/emails.module';
import { ExchangeRatesModule } from '@121-service/src/exchange-rates/exchange-rates.module';
import { HealthModule } from '@121-service/src/health/health.module';
import { MetricsModule } from '@121-service/src/metrics/metrics.module';
import { NoteModule } from '@121-service/src/notes/notes.module';
import { MessageModule } from '@121-service/src/notifications/message.module';
import { MessageIncomingModule } from '@121-service/src/notifications/message-incoming/message-incoming.module';
import { OrganizationModule } from '@121-service/src/organization/organization.module';
import { CommercialBankEthiopiaReconciliationModule } from '@121-service/src/payments/reconciliation/commercial-bank-ethiopia-reconciliation/commercial-bank-ethiopia-reconciliation.module';
import { ExcelReconcilicationModule } from '@121-service/src/payments/reconciliation/excel/excel-reconciliation.module';
import { IntersolveVisaReconciliationModule } from '@121-service/src/payments/reconciliation/intersolve-visa-reconciliation/intersolve-visa-reconciliation.module';
import { IntersolveVoucherReconciliationModule } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.module';
import { SafaricomReconciliationModule } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/safaricom-reconciliation.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { ProjectAidworkerAssignmentEntity } from '@121-service/src/programs/project-aidworker.entity';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { NedbankReconciliationModule } from '@121-service/src/reconciliation/nedbank-reconciliation/nedbank-reconciliation.module';
import { ScriptsModule } from '@121-service/src/scripts/scripts.module';
import { ProgramExistenceInterceptor } from '@121-service/src/shared/interceptors/program-existence.interceptor';
import { TransactionJobProcessorsModule } from '@121-service/src/transaction-job-processors/transaction-job-processors.module';
import { TransactionQueuesModule } from '@121-service/src/transaction-queues/transaction-queues.module';
import { TypeOrmModule } from '@121-service/src/typeorm.module';

@Module({
  // Note: no need to import just any (new) Module in ApplicationModule, when another Module already imports it
  imports: [
    QueuesRegistryModule,
    TypeOrmModule,
    TypeORMNestJS.forFeature([ProjectAidworkerAssignmentEntity]),
    HealthModule,
    CronjobModule,
    ExchangeRatesModule,
    ScriptsModule,
    OrganizationModule,
    ProgramModule,
    MessageModule,
    MetricsModule,
    MessageIncomingModule,
    NedbankReconciliationModule,
    NoteModule,
    EmailsModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: './files',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        limit: THROTTLING_LIMIT_GENERIC.default.limit,
        ttl: THROTTLING_LIMIT_GENERIC.default.ttl,
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_PASSWORD ? {} : undefined, // This enables SSL
      },
      prefix: process.env.REDIS_PREFIX,
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
    AuthModule,
    ActivitiesModule,
    TransactionQueuesModule,
    TransactionJobProcessorsModule,
    CommercialBankEthiopiaReconciliationModule,
    ExcelReconcilicationModule,
    IntersolveVisaReconciliationModule,
    IntersolveVoucherReconciliationModule,
    SafaricomReconciliationModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ProgramExistenceInterceptor,
    },
  ],
})
export class ApplicationModule implements OnApplicationBootstrap {
  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.runMigrations();
  }
}
