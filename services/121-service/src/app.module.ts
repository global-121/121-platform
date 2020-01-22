import { AppointmentModule } from './schedule/appointment/appointment.module';
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
import { SchemaService } from './sovrin/schema/schema.service';
import { ProofModule } from './sovrin/proof/proof.module';
import { SchemaModule } from './sovrin/schema/schema.module';
import { SmsService } from './notifications/sms/sms.service';
import { SmsController } from './notifications/sms/sms.controller';
import { SmsModule } from './notifications/sms/sms.module';
import { VoiceService } from './notifications/voice/voice.service';
import { VoiceController } from './notifications/voice/voice.controller';
import { VoiceModule } from './notifications/voice/voice.module';
import { FundingService } from './funding/funding.service';
import { FundingModule } from './funding/funding.module';
import { LookupController } from './notifications/lookup/lookup.controller';
import { LookupService } from './notifications/lookup/lookup.service';
import { LookupModule } from './notifications/lookup/lookup.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ProgramModule,
    StandardCriteriumModule,
    UserModule,
    CountryModule,
    HealthModule,
    AppointmentModule,
    CreateConnectionModule,
    CredentialModule,
    ProofModule,
    SchemaModule,
    SmsModule,
    VoiceModule,
    FundingModule,
    LookupModule,
  ],
  controllers: [
    AppController,
    SmsController,
    VoiceController,
    LookupController,
    // CreateConnectionController,
    // CredentialController,
  ],
  providers: [],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) {}
}
