import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ActionModule } from './actions/action.module';
import { AppController } from './app.controller';
import { CronjobModule } from './cronjob/cronjob.module';
import { ExportMetricsModule } from './export-metrics/export-metrics.module';
import { FspModule } from './fsp/fsp.module';
import { HealthModule } from './health.module';
import { InstanceModule } from './instance/instance.module';
import { LookupModule } from './notifications/lookup/lookup.module';
import { SmsModule } from './notifications/sms/sms.module';
import { VoiceModule } from './notifications/voice/voice.module';
import { WhatsappModule } from './notifications/whatsapp/whatsapp.module';
import { PeopleAffectedModule } from './people-affected/people-affected.module';
import { ProgramModule } from './programs/programs.module';
import { RegistrationsModule } from './registration/registrations.module';
import { ScriptsModule } from './scripts/scripts.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ProgramModule,
    UserModule,
    HealthModule,
    CronjobModule,
    SmsModule,
    VoiceModule,
    LookupModule,
    ScriptsModule,
    ActionModule,
    PeopleAffectedModule,
    FspModule,
    InstanceModule,
    RegistrationsModule,
    ExportMetricsModule,
    WhatsappModule,
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: './files',
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) {}
}
