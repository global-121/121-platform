import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ActionModule } from './actions/action.module';
import { AppController } from './app.controller';
import { CronjobModule } from './cronjob/cronjob.module';
import { FspModule } from './fsp/fsp.module';
import { HealthModule } from './health.module';
import { InstanceModule } from './instance/instance.module';
import { MetricsModule } from './metrics/metrics.module';
import { NoteModule } from './notes/notes.module';
import { LookupModule } from './notifications/lookup/lookup.module';
import { MessageModule } from './notifications/message.module';
import { SmsModule } from './notifications/sms/sms.module';
import { WhatsappIncomingModule } from './notifications/whatsapp/whatsapp-incoming.module';
import { WhatsappModule } from './notifications/whatsapp/whatsapp.module';
import { PeopleAffectedModule } from './people-affected/people-affected.module';
import { ProgramModule } from './programs/programs.module';
import { RegistrationsModule } from './registration/registrations.module';
import { ScriptsModule } from './scripts/scripts.module';
import { TypeOrmModule } from './typeorm.module';
import { UserModule } from './user/user.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule,
    ProgramModule,
    UserModule,
    HealthModule,
    CronjobModule,
    SmsModule,
    LookupModule,
    ScriptsModule,
    ActionModule,
    PeopleAffectedModule,
    FspModule,
    InstanceModule,
    RegistrationsModule,
    MessageModule,
    MetricsModule,
    WhatsappModule,
    WhatsappIncomingModule,
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
      },
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
      // TODO: Queueing: Add prefix for queues here (maybe program name or something)
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApplicationModule {}
