import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FspsModule } from '@121-service/src/fsp-management/fsp.module';
import { KoboConnectModule } from '@121-service/src/kobo-connect/kobo-connect.module';
import { LookupModule } from '@121-service/src/notifications/lookup/lookup.module';
import { IntersolveVisaModule } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { ProgramAttributesModule } from '@121-service/src/program-attributes/program-attributes.module';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationsModule } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.module';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeEntity } from '@121-service/src/programs/entities/program-registration-attribute.entity';
import { ProgramAttachmentsModule } from '@121-service/src/programs/program-attachments/program-attachments.module';
import { ProgramController } from '@121-service/src/programs/programs.controller';
import { ProgramService } from '@121-service/src/programs/programs.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import { ProgramExistenceInterceptor } from '@121-service/src/shared/interceptors/program-existence.interceptor';
import { UserModule } from '@121-service/src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramEntity,
      ProgramRegistrationAttributeEntity,
      ProgramFspConfigurationEntity,
    ]),
    UserModule,
    FspsModule,
    HttpModule,
    LookupModule,
    UserModule,
    ProgramAttachmentsModule,
    ProgramAttributesModule,
    KoboConnectModule,
    ProgramFspConfigurationsModule,
    IntersolveVisaModule,
  ],
  providers: [
    ProgramService,
    ProgramRepository,
    ProgramExistenceInterceptor,
    ProgramRegistrationAttributeRepository,
  ],
  controllers: [ProgramController],
  exports: [
    ProgramService,
    ProgramRepository,
    ProgramRegistrationAttributeRepository,
  ],
})
export class ProgramModule {}
