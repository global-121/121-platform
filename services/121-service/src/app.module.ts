import { WhatsappModule } from './notifications/whatsapp/whatsapp.module';
import { CronjobModule } from './cronjob/cronjob.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { ProgramModule } from './programs/program/program.module';
import { UserModule } from './user/user.module';
import { HealthModule } from './health.module';
import { CreateConnectionModule } from './sovrin/create-connection/create-connection.module';
import { CredentialModule } from './sovrin/credential/credential.module';
import { ProofModule } from './sovrin/proof/proof.module';
import { SchemaModule } from './sovrin/schema/schema.module';
import { SmsModule } from './notifications/sms/sms.module';
import { VoiceModule } from './notifications/voice/voice.module';
import { LookupModule } from './notifications/lookup/lookup.module';
import { ScriptsModule } from './scripts/scripts.module';
import { ActionModule } from './actions/action.module';
import { FspModule } from './programs/fsp/fsp.module';
import { InstanceModule } from './instance/instance.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ProgramModule,
    UserModule,
    HealthModule,
    CronjobModule,
    CreateConnectionModule,
    CredentialModule,
    ProofModule,
    SchemaModule,
    SmsModule,
    VoiceModule,
    LookupModule,
    ScriptsModule,
    ActionModule,
    FspModule,
    InstanceModule,
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
