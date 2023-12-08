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
import { SeedNLProgramLVV } from './seed-program-nlrc-lvv';
import { SeedNLProgramPV } from './seed-program-nlrc-pv';
import { SeedProgramValidation } from './seed-program-validation';
import { MessageTemplateModule } from '../notifications/message-template/message-template.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions),
    MessageTemplateModule,
  ],
  providers: [
    SeedInit,
    SeedProd,
    SeedHelper,
    SeedProgramValidation,
    SeedNLProgramLVV,
    SeedNLProgramPV,
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
