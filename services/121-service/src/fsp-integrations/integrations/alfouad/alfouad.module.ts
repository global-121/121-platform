import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.service';
import { AlfouadApiService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule],
  providers: [AlfouadService, AlfouadApiService, CustomHttpService],
  exports: [AlfouadService],
})
export class AlfouadModule {}
