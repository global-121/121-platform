import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScriptsController } from './scripts.controller';
import { SeedInit } from './seed-init';
import { SeedDev } from './seed-dev';
import { SeedProd } from './seed-prod';
import { SeedHelper } from './seed-helper';
import { SeedMultiProgram } from './seed-program-multi';
import { SeedProgramValidation } from './seed-program-validation';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
import { SeedDemoProgram } from './seed-program-demo';
import MigrateRefactor from './migrate-registrations-refactor';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      migrations: [`src/migrations/*.{ts,js}`],
      entities: ['src/app/**/*.entity.{ts,js}'],
    }),
  ],
  providers: [
    SeedDev,
    SeedInit,
    SeedProd,
    SeedHelper,
    SeedProgramValidation,
    SeedMultiProgram,
    SeedPilotNLProgram,
    SeedPilotNL2Program,
    SeedDemoProgram,
    MigrateRefactor,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(): Promise<void>;
}
