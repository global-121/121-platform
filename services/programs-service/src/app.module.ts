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
import { CreateConnectionController } from './create-connection/create-connection.controller';
import { CreateConnectionService } from './create-connection/create-connection.service';
import { CreateConnectionModule } from './create-connection/create-connection.module';

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
  ],
  controllers: [AppController, CreateConnectionController],
  providers: [CreateConnectionService],
})
export class ApplicationModule {
  public constructor(private readonly connection: Connection) {}
}
