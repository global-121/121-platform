import { BullModule } from '@nestjs/bull';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule as TypeORMNestJS } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CronjobModule } from './cronjob/cronjob.module';
import { HealthModule } from './health.module';
import { InstanceModule } from './instance/instance.module';
import { MetricsModule } from './metrics/metrics.module';
import { NoteModule } from './notes/notes.module';
import { MessageIncomingModule } from './notifications/message-incoming/message-incoming.module';
import { MessageModule } from './notifications/message.module';
import { ProgramFinancialServiceProviderConfigurationsModule } from './program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { ProgramAidworkerAssignmentEntity } from './programs/program-aidworker.entity';
import { ScriptsModule } from './scripts/scripts.module';
import { TransferQueuesModule } from './transfer-queues/transfer-queues.module';
import { TypeOrmModule } from './typeorm.module';

@Module({
  // Note: no need to import just any (new) Module in ApplicationModule, when another Module already imports it
  imports: [
    TypeOrmModule,
    TypeORMNestJS.forFeature([ProgramAidworkerAssignmentEntity]),
    HealthModule,
    CronjobModule,
    ScriptsModule,
    InstanceModule,
    MessageModule,
    MetricsModule,
    MessageIncomingModule,
    NoteModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: './files',
    }),
    ThrottlerModule.forRoot({
      ttl: +process.env.GENERIC_THROTTLING_TTL || 60,
      limit: +process.env.GENERIC_THROTTLING_LIMIT || 3000,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD
          ? process.env.REDIS_PASSWORD
          : null,
        tls: process.env.REDIS_PASSWORD ? {} : null, // This enables SSL
      },
      prefix: process.env.REDIS_PREFIX,
      defaultJobOptions: {
        removeOnComplete: true,
      },
    }),
    AuthModule,
    ProgramFinancialServiceProviderConfigurationsModule, // TODO: REFACTOR: move this import to the PaymentsModule and other Modules that depend on it (improves loose coupling and start-up time)
    TransferQueuesModule, // TODO: REFACTOR: move this import to the PaymentsModule and other Modules that depend on it (improves loose coupling and start-up time)
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
  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.dataSource.runMigrations();
  }
}
