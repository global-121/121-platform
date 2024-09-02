import { FinancialServiceProviderCallbackJobProcessorsService } from '@121-service/src/financial-service-provider-callback-job-processors/financial-service-provider-callback-job-processors.service';
import { CallbackJobProcessorSafaricom } from '@121-service/src/financial-service-provider-callback-job-processors/processors/callback-job-safaricom.processor';
import { SafaricomModule } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { createScopedRepositoryProvider } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { Module } from '@nestjs/common';

@Module({
  imports: [RedisModule, SafaricomModule],
  providers: [
    CallbackJobProcessorSafaricom,
    FinancialServiceProviderCallbackJobProcessorsService,
    createScopedRepositoryProvider(TransactionEntity),
  ],
})
export class FinancialServiceProviderCallbackJobProcessorsModule {}
