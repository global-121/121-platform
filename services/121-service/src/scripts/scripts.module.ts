import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ORMConfig } from '../../ormconfig';
import { ScriptsController } from './scripts.controller';
import SeedEthJointResponse from './seed-eth-joint-response';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';
import { SeedProd } from './seed-prod';
import { SeedDemoProgram } from './seed-program-demo';
import SeedProgramEth from './seed-program-eth';
import SeedProgramLbn from './seed-program-lbn';
import { SeedPilotNLProgram } from './seed-program-pilot-nl';
import { SeedPilotNL2Program } from './seed-program-pilot-nl-2';
import { SeedProgramValidation } from './seed-program-validation';

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
    SeedEthJointResponse,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(
    isApiTests?: boolean,
    squareString?: string,
    nrPaymentsString?: string,
    squareNumberBulkMessageString?: string,
  ): Promise<void>;
}
