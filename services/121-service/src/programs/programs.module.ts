import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../actions/action.entity';
import { ActionModule } from '../actions/action.module';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { FspQuestionEntity } from '../fsp/fsp-question.entity';
import { FspModule } from '../fsp/fsp.module';
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
    ActionModule,
    UserModule,
    FspModule,
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
