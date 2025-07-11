import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/airtel.service';
import { AirtelApiHelperService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.helper.service';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { AirtelEncryptionService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.encryption.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [HttpModule, RedisModule, QueuesRegistryModule],
  providers: [
    AirtelService,
    AirtelEncryptionService,
    AirtelApiHelperService,
    AirtelApiService,
    TokenValidationService,
    CustomHttpService,
  ],
  exports: [AirtelService],
})
export class AirtelModule {}
