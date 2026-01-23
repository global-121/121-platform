import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { ORMConfig } from '@121-service/src/ormconfig';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { MockSeedFactoryService } from '@121-service/src/scripts/factories/mock-seed-factory.service';
import { ScriptsController } from '@121-service/src/scripts/scripts.controller';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { ScriptsService } from '@121-service/src/scripts/services/scripts.service';
import { SeedHelperService } from '@121-service/src/scripts/services/seed-helper.service';
import { SeedMockHelperService } from '@121-service/src/scripts/services/seed-mock-helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { ApproverModule } from '@121-service/src/user/approver/approver.module';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions),
    MessageTemplateModule,
    QueuesRegistryModule,
    ProgramModule,
    HttpModule,
    ProgramFspConfigurationsModule,
    ApproverModule,
  ],
  providers: [
    ScriptsService,
    SeedInit,
    SeedHelperService,
    SeedMultipleNLRCMockData,
    SeedMockHelperService,
    MockSeedFactoryService,
    AxiosCallsService,
    CustomHttpService,
  ],
  controllers: [ScriptsController],
})
export class ScriptsModule {}

export interface InterfaceScript {
  run({
    isApiTests,
    squareString,
    nrPaymentsString,
    squareNumberBulkMessageString,
  }: {
    isApiTests?: boolean;
    squareString?: string;
    nrPaymentsString?: string;
    squareNumberBulkMessageString?: string;
  }): Promise<void>;
}
