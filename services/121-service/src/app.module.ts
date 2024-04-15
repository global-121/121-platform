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
import { EventsModule } from './events/events.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { FspModule } from './fsp/fsp.module';
import { HealthModule } from './health.module';
import { InstanceModule } from './instance/instance.module';
import { MetricsModule } from './metrics/metrics.module';
import { NoteModule } from './notes/notes.module';
import { MessageIncomingModule } from './notifications/message-incoming/message-incoming.module';
import { MessageModule } from './notifications/message.module';
import { SmsModule } from './notifications/sms/sms.module';
import { WhatsappModule } from './notifications/whatsapp/whatsapp.module';
import { PeopleAffectedModule } from './people-affected/people-affected.module';
import { ProgramAidworkerAssignmentEntity } from './programs/program-aidworker.entity';
import { RegistrationsModule } from './registration/registrations.module';
import { ScriptsModule } from './scripts/scripts.module';
import { TypeOrmModule } from './typeorm.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule,
    TypeORMNestJS.forFeature([ProgramAidworkerAssignmentEntity]),
    //ProgramModule, // Remove?
    //ProgramAttributesModule, // Remove?
    //MessageTemplateModule,  // Remove?
    UserModule, // Remove?
    HealthModule,
    CronjobModule,
    SmsModule,
    //LookupModule, // Remove?
    ScriptsModule,
    //ActionsModule,  // Remove?
    PeopleAffectedModule,
    //FspModule, // Remove?
    InstanceModule,
    RegistrationsModule, // Remove?
    MessageModule, // Remove?
    MetricsModule,
    MessageIncomingModule,
    WhatsappModule, // Remove?
    NoteModule,
    ExchangeRateModule,
    EventsModule, // Remove?
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
