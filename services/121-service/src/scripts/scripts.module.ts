import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ORMConfig } from '../../ormconfig';
import { ScriptsController } from './scripts.controller';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';
import { SeedProd } from './seed-prod';
import { SeedDemoProgram } from './seed-program-demo';
import SeedProgramEth from './seed-program-eth';
import SeedProgramLbn from './seed-program-lbn';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
import { SeedProgramValidation } from './seed-program-validation';
import SeedProgramDorcasEth from './seed-program-dorcas-eth';

@Module({
  imports: [TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions)],
  providers: [
    SeedInit,
    SeedProd,
    SeedHelper,
    SeedProgramValidation,
    SeedPilotNLProgram,
    SeedPilotNL2Program,
    SeedProgramEth,
    SeedProgramLbn,
    SeedDemoProgram,
    SeedProgramDorcasEth,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(): Promise<void>;
}
