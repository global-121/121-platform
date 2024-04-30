import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../actions/action.entity';
import { ActionsModule } from '../actions/actions.module';
import { FinancialServiceProviderEntity } from '../financial-service-provider/financial-service-provider.entity';
import { FinancialServiceProviderModule } from '../financial-service-provider/financial-service-provider.module';
import { FspQuestionEntity } from '../financial-service-provider/fsp-question.entity';
import { KoboConnectModule } from '../kobo-connect/kobo-connect.module';
import { LookupModule } from '../notifications/lookup/lookup.module';
import { ProgramAttributesModule } from '../program-attributes/program-attributes.module';
import { UserModule } from '../user/user.module';
import { ProgramFspConfigurationController } from './fsp-configuration/fsp-configuration.controller';
import { ProgramFspConfigurationService } from './fsp-configuration/fsp-configuration.service';
import { ProgramFspConfigurationEntity } from './fsp-configuration/program-fsp-configuration.entity';
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
      FspQuestionEntity,
      ProgramQuestionEntity,
      ProgramCustomAttributeEntity,
      ProgramFspConfigurationEntity,
    ]),
    ActionsModule,
    UserModule,
    FinancialServiceProviderModule,
    HttpModule,
    LookupModule,
    UserModule,
    ProgramAttributesModule,
    KoboConnectModule,
  ],
  providers: [ProgramService, ProgramFspConfigurationService],
  controllers: [ProgramController, ProgramFspConfigurationController],
  exports: [ProgramService, ProgramFspConfigurationService],
})
export class ProgramModule {}
