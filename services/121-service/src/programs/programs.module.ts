import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProvidersModule } from '@121-service/src/financial-service-providers/financial-service-provider.module';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { KoboConnectModule } from '@121-service/src/kobo-connect/kobo-connect.module';
import { LookupModule } from '@121-service/src/notifications/lookup/lookup.module';
import { ProgramAttributesModule } from '@121-service/src/program-attributes/program-attributes.module';
import { ProgramFspConfigurationController } from '@121-service/src/programs/fsp-configuration/fsp-configuration.controller';
import { ProgramFspConfigurationService } from '@121-service/src/programs/fsp-configuration/fsp-configuration.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramCustomAttributeEntity } from '@121-service/src/programs/program-custom-attribute.entity';
import { ProgramQuestionEntity } from '@121-service/src/programs/program-question.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramController } from '@121-service/src/programs/programs.controller';
import { ProgramService } from '@121-service/src/programs/programs.service';
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
      ProgramFspConfigurationEntity,
    ]),
    ActionsModule,
    UserModule,
    FinancialServiceProvidersModule,
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
