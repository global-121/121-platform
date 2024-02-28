import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ORMConfig } from '../../ormconfig';
import { MessageTemplateModule } from '../notifications/message-template/message-template.module';
import { ProgramModule } from '../programs/programs.module';
import { CustomHttpService } from '../shared/services/custom-http.service';
import { AxiosCallsService } from '../utils/axios/axios-calls.service';
import { QueueSeedHelperModule } from './queue-seed-helper/queue-seed-helper.module';
import { ScriptsController } from './scripts.controller';
import SeedEthJointResponse from './seed-eth-joint-response';
import { SeedHelper } from './seed-helper';
import { SeedInit } from './seed-init';
import { SeedMockHelper } from './seed-mock-helpers';
import SeedMultipleKRCS from './seed-multiple-krcs';
import SeedMultipleNLRC from './seed-multiple-nlrc';
import { SeedMultipleNLRCMockData } from './seed-multiple-nlrc-mock';
import { SeedDemoProgram } from './seed-program-demo';
import SeedProgramDrc from './seed-program-drc';
import SeedProgramEth from './seed-program-eth';
import SeedProgramLbn from './seed-program-lbn';
import { SeedNLProgramPV } from './seed-program-nlrc-pv';
import SeedTestProgram from './seed-program-test';
import SeedTestMultipleProgram from './seed-program-test-multiple';
import SeedProgramUkr from './seed-program-ukr';
import { SeedProgramValidation } from './seed-program-validation';

@Module({
  imports: [
    TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions),
    MessageTemplateModule,
    QueueSeedHelperModule,
    ProgramModule,
    HttpModule,
  ],
  providers: [
    SeedInit,
    SeedHelper,
    SeedProgramValidation,
    SeedNLProgramPV,
    SeedProgramEth,
    SeedProgramLbn,
    SeedDemoProgram,
    SeedEthJointResponse,
    SeedMultipleKRCS,
    SeedProgramUkr,
    SeedMultipleNLRC,
    SeedMultipleNLRCMockData,
    SeedProgramDrc,
    SeedTestProgram,
    SeedTestMultipleProgram,
    SeedMockHelper,
    AxiosCallsService,
    CustomHttpService,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run(
    isApiTests?: boolean,
    squareString?: number,
    nrPaymentsString?: number,
    squareNumberBulkMessageString?: number,
  ): Promise<void>;
}

export class SeedBase {
  public constructor(private seedHelper: SeedHelper) {}
}
