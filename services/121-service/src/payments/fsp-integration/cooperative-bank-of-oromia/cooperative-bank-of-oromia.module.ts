import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';
import { CooperativeBankOfOromiaApiService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';
import { CooperativeBankOfOromiaEncryptionService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.encryption.service';
import { CooperativeBankOfOromiaService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [HttpModule, RedisModule, QueuesRegistryModule],
  providers: [
    CooperativeBankOfOromiaService,
    CooperativeBankOfOromiaEncryptionService,
    CooperativeBankOfOromiaApiHelperService,
    CooperativeBankOfOromiaApiService,
    TokenValidationService,
    CustomHttpService,
  ],
  exports: [CooperativeBankOfOromiaService],
})
export class CooperativeBankOfOromiaModule {}
