import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/airtel.service';
import { AirtelDisbursementEntity } from '@121-service/src/payments/fsp-integration/airtel/entities/airtel-disbursement.entity';
import { AirtelDisbursementScopedRepository } from '@121-service/src/payments/fsp-integration/airtel/repositories/airtel-disbursement.scoped.repository';
import { AirtelApiService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.api.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([AirtelDisbursementEntity]),
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    AirtelService,
    AirtelApiService,
    TokenValidationService,
    CustomHttpService,
    AirtelDisbursementScopedRepository,
  ],
  exports: [AirtelService, AirtelDisbursementScopedRepository],
})
export class AirtelModule {}
