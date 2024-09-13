import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { SafaricomTransferRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomController } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.controller';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { FinancialServiceProviderCallbackQueuesNames } from '@121-service/src/shared/enum/financial-service-provider-callback-queue-names.enum';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([SafaricomTransferEntity]),
    RedisModule,
    BullModule.registerQueue({
      name: FinancialServiceProviderCallbackQueuesNames.safaricomTransferCallback,
      processors: [
        {
          path: 'src/financial-service-provider-callback-job-processors/processors/safaricom-callback-job.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    BullModule.registerQueue({
      name: FinancialServiceProviderCallbackQueuesNames.safaricomTransferTimeoutCallback,
      processors: [
        {
          path: 'src/financial-service-provider-callback-job-processors/processors/safaricom-timeout-callback-job.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [
    SafaricomService,
    SafaricomApiService,
    CustomHttpService,
    SafaricomTransferRepository,
  ],
  controllers: [SafaricomController],
  exports: [SafaricomService, SafaricomTransferRepository],
})
export class SafaricomModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(SafaricomController);
  }
}
