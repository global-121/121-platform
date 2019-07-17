import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import { ProgramModule } from './program/program.module';
import { StandardCriteriumModule } from './standard-criterium/standard-criterium.module';
import { UserModule } from './user/user.module';
import { CountryModule } from './country/country.module';
import { HealthModule } from './health.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { AppointmentModule } from './appointment/appointment.module';
import { CreateConnectionController } from './sovrin/create-connection/create-connection.controller';
import { CreateConnectionService } from './sovrin/create-connection/create-connection.service';
import { CreateConnectionModule } from './sovrin/create-connection/create-connection.module';
import { CredentialController } from './sovrin/credential/credential.controller';
import { CredentialService } from './sovrin/credential/credential.service';
import { CredentialModule } from './sovrin/credential/credential.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ProgramModule,
    StandardCriteriumModule,
    UserModule,
    CountryModule,
    HealthModule,
    EnrollmentModule,
    AppointmentModule,
    CreateConnectionModule,
    CredentialModule,
  ],
  controllers: [
    AppController,
    CreateConnectionController,
    CredentialController,
  ],
  providers: [CreateConnectionService, CredentialService],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) {}
}
