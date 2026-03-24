import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { MessageTemplateModule } from '@121-service/src/notifications/message-template/message-template.module';
import { ORMConfig } from '@121-service/src/ormconfig';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramApprovalThresholdsModule } from '@121-service/src/programs/program-approval-thresholds/program-approval-thresholds.module';
import { ProgramModule } from '@121-service/src/programs/programs.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { MockSeedFactoryService } from '@121-service/src/scripts/factories/mock-seed-factory.service';
import { ScriptsController } from '@121-service/src/scripts/scripts.controller';
import { SeedConfigurationDto } from '@121-service/src/scripts/seed-configuration.dto';
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
    ProgramModule,
    HttpModule,
    ProgramFspConfigurationsModule,
    ProgramApprovalThresholdsModule,
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
  // eslint-disable-next-line @typescript-eslint/method-signature-style -- Allow this method to be overridden in: seed-multiple-nlrc-mock.ts
  run({
    isApiTests,
    powerNrRegistrationsString,
    nrPaymentsString,
    powerNrMessagesString,
  }: {
    isApiTests?: boolean;
    powerNrRegistrationsString?: string;
    nrPaymentsString?: string;
    powerNrMessagesString?: string;
    includeRegistrationEvents?: boolean;
    mockPv?: boolean;
    mockOcw?: boolean;
    seedConfig?: SeedConfigurationDto;
    approverMode?: ApproverSeedMode;
  }): Promise<void>;
}
