import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';
import { CooperativeBankOfOromiaApiService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';
import { CooperativeBankOfOromiaService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [HttpModule],
  providers: [
    CooperativeBankOfOromiaService,
    CooperativeBankOfOromiaApiService,
    CooperativeBankOfOromiaApiHelperService,
    CustomHttpService,
    TokenValidationService,
  ],
  exports: [CooperativeBankOfOromiaService],
})
export class CooperativeBankOfOromiaModule {}
