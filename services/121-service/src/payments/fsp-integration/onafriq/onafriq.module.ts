import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { OnafriqTransactionScopedRepository } from '@121-service/src/payments/fsp-integration/onafriq/repositories/onafriq-transaction.scoped.repository';
import { OnafriqApiHelperService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.helper.service';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([OnafriqTransactionEntity]),
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    OnafriqService,
    OnafriqApiService,
    OnafriqApiHelperService,
    CustomHttpService,
    OnafriqTransactionScopedRepository,
  ],
  exports: [OnafriqService, OnafriqTransactionScopedRepository],
})
export class OnafriqModule {}
