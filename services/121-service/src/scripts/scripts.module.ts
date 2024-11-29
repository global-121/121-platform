import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { ORMConfig } from '@121-service/src/ormconfig';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueueRegistryModule } from '@121-service/src/queue-registry/queue-registry.module';
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
import { SeedNLProgramPV } from '@121-service/src/scripts/seed-program-nlrc-pv';
import { SeedTestProgram } from '@121-service/src/scripts/seed-program-test';
import { SeedTestMultipleProgram } from '@121-service/src/scripts/seed-program-test-multiple';
import { SeedTestOneAdmin } from '@121-service/src/scripts/seed-program-test-one-admin';
import { SeedProgramValidation } from '@121-service/src/scripts/seed-program-validation';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions),
    MessageTemplateModule,
    QueueRegistryModule,
    ProgramModule,
    HttpModule,
    ProgramFinancialServiceProviderConfigurationsModule,
  ],
  providers: [
    ScriptsService,
    SeedInit,
    SeedHelper,
    SeedProgramValidation,
    SeedNLProgramPV,
    SeedDemoProgram,
    SeedEthJointResponse,
    SeedMultipleKRCS,
    SeedMultipleNLRC,
    SeedMultipleNLRCMockData,
    SeedTestProgram,
    SeedTestOneAdmin,
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
