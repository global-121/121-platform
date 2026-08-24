import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramFspConfigurationEntity]),
  ],
  providers: [
    AlfouadService,
    AlfouadApiService,
    AlfouadApiHelperService,
    AlfouadEncryptionService,
    CustomHttpService,
    ProgramFspConfigurationRepository,
  ],
  exports: [AlfouadService],
})
export class AlfouadModule {}
