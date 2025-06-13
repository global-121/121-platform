import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionEntity } from '@121-service/src/actions/action.entity';
import { ActionsModule } from '@121-service/src/actions/actions.module';
import { FinancialServiceProvidersModule } from '@121-service/src/fsps/fsp.module';
import { KoboConnectModule } from '@121-service/src/kobo-connect/kobo-connect.module';
import { LookupModule } from '@121-service/src/notifications/lookup/lookup.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { ProgramAttributesModule } from '@121-service/src/program-attributes/program-attributes.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFinancialServiceProviderConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/program-registration-attribute.entity';
import { ProgramController } from '@121-service/src/programs/programs.controller';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { ProgramExistenceInterceptor } from '@121-service/src/shared/interceptors/program-existence.interceptor';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramRegistrationAttributeEntity,
      ActionEntity,
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
    ProgramFinancialServiceProviderConfigurationsModule,
    IntersolveVisaModule,
  ],
  providers: [ProgramService, ProgramRepository, ProgramExistenceInterceptor],
  controllers: [ProgramController],
  exports: [ProgramService, ProgramRepository],
})
export class ProgramModule {}
