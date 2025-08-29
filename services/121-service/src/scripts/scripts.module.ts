import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { ORMConfig } from '@121-service/src/ormconfig';
import { ProjectFspConfigurationsModule } from '@121-service/src/project-fsp-configurations/project-fsp-configurations.module';
import { ProjectModule } from '@121-service/src/projects/projects.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { ScriptsController } from '@121-service/src/scripts/scripts.controller';
import { SeedInit } from '@121-service/src/scripts/seed-init';
import { SeedMultipleNLRCMockData } from '@121-service/src/scripts/seed-multiple-nlrc-mock';
import { ScriptsService } from '@121-service/src/scripts/services/scripts.service';
import { SeedHelperService } from '@121-service/src/scripts/services/seed-helper.service';
import { SeedMockHelperService } from '@121-service/src/scripts/services/seed-mock-helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { AxiosCallsService } from '@121-service/src/utils/axios/axios-calls.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(ORMConfig as TypeOrmModuleOptions),
    MessageTemplateModule,
    QueuesRegistryModule,
    ProjectModule,
    HttpModule,
    ProjectFspConfigurationsModule,
  ],
  providers: [
    ScriptsService,
    SeedInit,
    SeedHelperService,
    SeedMultipleNLRCMockData,
    SeedMockHelperService,
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
