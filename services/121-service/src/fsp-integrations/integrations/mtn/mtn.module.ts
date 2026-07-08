import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ProgramFspConfigurationEntity]),
  ],
  providers: [
    MtnService,
    MtnApiService,
    MtnApiHelperService,
    CustomHttpService,
    ProgramFspConfigurationRepository,
  ],
  exports: [MtnService],
})
export class MtnModule {}
