import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { ORMConfig } from '@121-service/src/ormconfig';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueueSeedHelperModule } from '@121-service/src/scripts/queue-seed-helper/queue-seed-helper.module';
import { ScriptsController } from '@121-service/src/scripts/scripts.controller';
import { ScriptsService } from '@121-service/src/scripts/scripts.service';
import { SeedEthJointResponse } from '@121-service/src/scripts/seed-eth-joint-response';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMockHelper } from '@121-service/src/scripts/seed-mock-helpers';
import { SeedMultipleKRCS } from '@121-service/src/scripts/seed-multiple-krcs';
import { SeedMultipleNLRC } from '@121-service/src/scripts/seed-multiple-nlrc';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { SeedDemoProgram } from '@121-service/src/scripts/seed-program-demo';
import { SeedProgramDrc } from '@121-service/src/scripts/seed-program-drc';
import { SeedProgramEth } from '@121-service/src/scripts/seed-program-eth';
import { SeedProgramLbn } from '@121-service/src/scripts/seed-program-lbn';
import { SeedNLProgramPV } from '@121-service/src/scripts/seed-program-nlrc-pv';
import { SeedTestProgram } from '@121-service/src/scripts/seed-program-test';
import { SeedTestMultipleProgram } from '@121-service/src/scripts/seed-program-test-multiple';
import { SeedProgramUkr } from '@121-service/src/scripts/seed-program-ukr';
import { SeedProgramValidation } from '@121-service/src/scripts/seed-program-validation';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions),
    MessageTemplateModule,
    QueueSeedHelperModule,
    ProgramModule,
    HttpModule,
  ],
  providers: [
    ScriptsService,
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
    squareString?: string,
    nrPaymentsString?: string,
    squareNumberBulkMessageString?: string,
  ): Promise<void>;
}
