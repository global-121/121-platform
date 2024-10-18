import { Module } from '@nestjs/common';

import { FinancialServiceProviderCallbackJobProcessorsService } from '@121-service/src/financial-service-provider-callback-job-processors/financial-service-provider-callback-job-processors.service';
import { TimeoutCallbackJobProcessorSafaricom } from '@121-service/src/financial-service-provider-callback-job-processors/processors/safaricom-timeout-callback-job.processor';
import { TransferCallbackJobProcessorSafaricom } from '@121-service/src/financial-service-provider-callback-job-processors/processors/safaricom-transfer-callback-job.processor';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [RedisModule, SafaricomModule],
  providers: [
    TransferCallbackJobProcessorSafaricom,
    TimeoutCallbackJobProcessorSafaricom,
    FinancialServiceProviderCallbackJobProcessorsService,
    createScopedRepositoryProvider(TransactionEntity),
  ],
})
export class FinancialServiceProviderCallbackJobProcessorsModule {}
