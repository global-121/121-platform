import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [HttpModule],
  providers: [
    MtnService,
    MtnApiService,
    MtnApiHelperService,
    CustomHttpService,
    TokenValidationService,
  ],
  exports: [MtnService],
})
export class MtnModule {}
