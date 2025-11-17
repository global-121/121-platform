import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CooperativeBankOfOromiaApiService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';
import { CooperativeBankOfOromiaService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [HttpModule],
  providers: [
    CooperativeBankOfOromiaService,
    CooperativeBankOfOromiaApiService,
    CustomHttpService,
  ],
  exports: [CooperativeBankOfOromiaService],
})
export class CooperativeBankOfOromiaModule {}
