import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { ProgramModule } from './programs/program/program.module';
import { StandardCriteriumModule } from './programs/standard-criterium/standard-criterium.module';
import { UserModule } from './user/user.module';
import { CountryModule } from './programs/country/country.module';
import { HealthModule } from './health.module';
import { CreateConnectionModule } from './sovrin/create-connection/create-connection.module';
import { CredentialModule } from './sovrin/credential/credential.module';
import { ProofModule } from './sovrin/proof/proof.module';
import { SchemaModule } from './sovrin/schema/schema.module';
import { SmsModule } from './notifications/sms/sms.module';
import { VoiceModule } from './notifications/voice/voice.module';
import { FundingModule } from './funding/funding.module';
import { LookupModule } from './notifications/lookup/lookup.module';
import { ScriptsModule } from './scripts/scripts.module';
import { ActionModule } from './actions/action.module';
import { FspModule } from './programs/fsp/fsp.module';
import { InstanceModule } from './instance/instance.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ProgramModule,
    StandardCriteriumModule,
    UserModule,
    CountryModule,
    HealthModule,
    CreateConnectionModule,
    CredentialModule,
    ProofModule,
    SchemaModule,
    SmsModule,
    VoiceModule,
    FundingModule,
    LookupModule,
    ScriptsModule,
    ActionModule,
    FspModule,
    InstanceModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) {}
}
