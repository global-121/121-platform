import { BullModule } from '@nestjs/bull';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { FinancialServiceProviderCallbackJobProcessorsModule } from '@121-service/src/financial-service-provider-callback-job-processors/financial-service-provider-callback-job-processors.module';
import { HealthModule } from '@121-service/src/health/health.module';
import { MetricsModule } from '@121-service/src/metrics/metrics.module';
import { MigrateVisaModule } from '@121-service/src/migrate-visa/migrate-visa.module';
import { NoteModule } from '@121-service/src/notes/notes.module';
import { MessageModule } from '@121-service/src/notifications/message.module';
import { MessageIncomingModule } from '@121-service/src/notifications/message-incoming/message-incoming.module';
import { OrganizationModule } from '@121-service/src/organization/organization.module';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { QueueHelperModule } from '@121-service/src/scripts/queue-helper/queue-helper.module';
import { QueueHelperService } from '@121-service/src/scripts/queue-helper/queue-helper.service';
import { ScriptsModule } from '@121-service/src/scripts/scripts.module';
import { TransactionJobProcessorsModule } from '@121-service/src/transaction-job-processors/transaction-job-processors.module';
import { TransactionQueuesModule } from '@121-service/src/transaction-queues/transaction-queues.module';
import { TypeOrmModule } from '@121-service/src/typeorm.module';

@Module({
  // Note: no need to import just any (new) Module in ApplicationModule, when another Module already imports it
  imports: [
    TypeOrmModule,
    TypeORMNestJS.forFeature([ProgramAidworkerAssignmentEntity]),
    HealthModule,
    CronjobModule,
    ScriptsModule,
    OrganizationModule,
    MessageModule,
    MetricsModule,
    MigrateVisaModule,
    MessageIncomingModule,
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
    FinancialServiceProviderCallbackJobProcessorsModule,
    QueueHelperModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApplicationModule implements OnApplicationBootstrap {
  constructor(
    private dataSource: DataSource,
    private queueHelperService: QueueHelperService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.runMigrations();
    // This is needed because of the issue where on 121-service startup jobs will start processing before the process handlers are registered, which leads to failed jobs.
    // We are not able to prevent this from happening, so instead this workaround will retry all failed jobs on startup. By then the process handler is up and the jobs will not fail for this reason again.
    await this.queueHelperService.retryFailedJobs();
  }
}
