import { Module } from '@nestjs/common';

import { TimeoutCallbackJobProcessorSafaricom } from '@121-service/src/financial-service-provider-callback-job-processors/processors/safaricom-timeout-callback-job.processor';
import { TransferCallbackJobProcessorSafaricom } from '@121-service/src/financial-service-provider-callback-job-processors/processors/safaricom-transfer-callback-job.processor';
import { SafaricomReconciliationModule } from '@121-service/src/payments/reconciliation/safaricom-reconciliation/safaricom-reconciliation.module';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';

@Module({
  imports: [RedisModule, SafaricomReconciliationModule],
  providers: [
    TransferCallbackJobProcessorSafaricom,
    TimeoutCallbackJobProcessorSafaricom,
  ],
})
export class FinancialServiceProviderCallbackJobProcessorsModule {}
