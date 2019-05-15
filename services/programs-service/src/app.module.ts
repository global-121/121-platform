import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ProgramModule } from './program/program.module';
import { CriteriumModule } from './criterium/criterium.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { OptionModule } from './option/option.module';
import { HealthModule } from './health.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    ProgramModule,
    CriteriumModule,
    UserModule,
    OptionModule,
    HealthModule
  ],
  controllers: [
    AppController
  ],
  providers: []
})
export class ApplicationModule {
  constructor(private readonly connection: Connection) {}
}
