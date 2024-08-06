import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProvidersModule } from '@121-service/src/financial-service-providers/financial-service-provider.module';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { KoboConnectModule } from '@121-service/src/kobo-connect/kobo-connect.module';
import { LookupModule } from '@121-service/src/notifications/lookup/lookup.module';
import { ProgramAttributesModule } from '@121-service/src/program-attributes/program-attributes.module';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configurations.module';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramController } from '@121-service/src/programs/programs.controller';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      FinancialServiceProviderEntity,
      ActionEntity,
      FspQuestionEntity,
      ProgramQuestionEntity,
      ProgramCustomAttributeEntity,
      ProgramFinancialServiceProviderConfigurationEntity,
    ]),
    ActionsModule,
    UserModule,
    FinancialServiceProvidersModule,
    HttpModule,
    LookupModule,
    UserModule,
    ProgramAttributesModule,
    KoboConnectModule,
    ProgramFinancialServiceProviderConfigurationsModule,
  ],
  providers: [ProgramService, ProgramRepository],
  controllers: [ProgramController],
  exports: [ProgramService, ProgramRepository],
})
export class ProgramModule {}
