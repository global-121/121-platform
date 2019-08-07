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
  ],
  controllers: [
    AppController,
    // CreateConnectionController,
    // CredentialController,
  ],
  providers: [
    // CreateConnectionService,
    // CredentialService,
    SchemaService
  ],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) {}
}
