import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { ORMConfig } from '@121-service/src/ormconfig';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { ScriptsController } from '@121-service/src/scripts/scripts.controller';
import { ScriptsService } from '@121-service/src/scripts/scripts.service';
import { SeedHelper } from '@121-service/src/scripts/seed-helper';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMockHelper } from '@121-service/src/scripts/seed-mock-helpers';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions),
    MessageTemplateModule,
    QueuesRegistryModule,
    ProgramModule,
    HttpModule,
    ProgramFinancialServiceProviderConfigurationsModule,
  ],
  providers: [
    ScriptsService,
    SeedInit,
    SeedHelper,
    SeedMultipleNLRCMockData,
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
