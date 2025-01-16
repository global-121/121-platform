import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-api.service';
import { NedbankVoucherEntity } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-voucher.entity';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([NedbankVoucherEntity, TransactionEntity]),
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    NedbankService,
    NedbankApiService,
    CustomHttpService,
    NedbankVoucherScopedRepository,
  ],
  exports: [NedbankService, NedbankVoucherScopedRepository],
})
export class NedbankModule {}
