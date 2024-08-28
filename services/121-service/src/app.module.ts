import { AppController } from '@121-service/src/app.controller';
import { AuthModule } from '@121-service/src/auth/auth.module';
import { CronjobModule } from '@121-service/src/cronjob/cronjob.module';
import { EmailsModule } from '@121-service/src/emails/emails.module';
import { HealthModule } from '@121-service/src/health/health.module';
import { MetricsModule } from '@121-service/src/metrics/metrics.module';
import { NoteModule } from '@121-service/src/notes/notes.module';
import { MessageIncomingModule } from '@121-service/src/notifications/message-incoming/message-incoming.module';
import { MessageModule } from '@121-service/src/notifications/message.module';
import { OrganizationModule } from '@121-service/src/organization/organization.module';
import { ProgramAidworkerAssignmentEntity } from '@121-service/src/programs/program-aidworker.entity';
import { ScriptsModule } from '@121-service/src/scripts/scripts.module';
import { TypeOrmModule } from '@121-service/src/typeorm.module';
import { BullModule } from '@nestjs/bull';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule as TypeORMNestJS } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

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
    MessageIncomingModule,
    NoteModule,
    EmailsModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: './files',
    }),
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.GENERIC_THROTTLING_TTL ?? '60'),
      limit: parseInt(process.env.GENERIC_THROTTLING_LIMIT ?? '3000'),
    }),
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
