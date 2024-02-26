import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../actions/action.entity';
import { ActionModule } from '../actions/action.module';
import { FinancialServiceProviderEntity } from '../financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProviderAttributeEntity } from '../financial-service-providers/financial-service-provider-attribute.entity';
import { FinancialServiceProvidersModule } from '../financial-service-providers/financial-service-providers.module';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { ProgramAttributesModule } from '../program-attributes/program-attributes.module';
import { UserModule } from '../user/user.module';
import { ProgramFinancialServiceProviderConfigurationsController } from './financial-service-provider-configurations/financial-service-provider-configurations.controller';
import { ProgramFinancialServiceProviderConfigurationEntity } from './financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationsService } from './financial-service-provider-configurations/financial-service-provider-configurations.service';
import { ProgramCustomAttributeEntity } from './program-custom-attribute.entity';
import { ProgramQuestionEntity } from './program-question.entity';
import { ProgramEntity } from './program.entity';
import { ProgramController } from './programs.controller';
import { ProgramService } from './programs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      FinancialServiceProviderEntity,
      ActionEntity,
      FinancialServiceProviderAttributeEntity,
      ProgramQuestionEntity,
      ProgramCustomAttributeEntity,
      ProgramFinancialServiceProviderConfigurationEntity,
    ]),
    ActionModule,
    UserModule,
    FinancialServiceProvidersModule,
    HttpModule,
    LookupModule,
    UserModule,
    ProgramAttributesModule,
  ],
  providers: [ProgramService, ProgramFinancialServiceProviderConfigurationsService],
  controllers: [ProgramController, ProgramFinancialServiceProviderConfigurationsController],
  exports: [ProgramService, ProgramFinancialServiceProviderConfigurationsService],
})
export class ProgramModule {}
