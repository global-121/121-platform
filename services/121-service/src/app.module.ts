import { ExportMetricsModule } from './export-metrics/export-metrics.module';
import { RegistrationsModule } from './registration/registrations.module';
import { WhatsappModule } from './notifications/whatsapp/whatsapp.module';
import { CronjobModule } from './cronjob/cronjob.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { ProgramModule } from './programs/programs.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health.module';
import { SmsModule } from './notifications/sms/sms.module';
import { VoiceModule } from './notifications/voice/voice.module';
import { LookupModule } from './notifications/lookup/lookup.module';
import { ScriptsModule } from './scripts/scripts.module';
import { ActionModule } from './actions/action.module';
import { FspModule } from './fsp/fsp.module';
import { InstanceModule } from './instance/instance.module';
import { MulterModule } from '@nestjs/platform-express';
import { PeopleAffectedModule } from './people-affected/people-affected.module';

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
