import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-transfer.entity';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomController } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.controller';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { QueueNamePaymentCallBack } from '@121-service/src/shared/enum/queue-process.names.enum';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      TransactionEntity,
      RegistrationEntity,
      SafaricomTransferEntity,
    ]),
    UserModule,
    TransactionsModule,
    RedisModule,
    BullModule.registerQueue({
      name: QueueNamePaymentCallBack.safaricom,
      processors: [
        {
          path: 'src/financial-service-provider-callback-job-processors/processors/callback-job-safaricom.processor.ts',
        },
      ],
      limiter: {
        max: 20, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
  ],
  providers: [SafaricomService, SafaricomApiService, CustomHttpService],
  controllers: [SafaricomController],
  exports: [SafaricomService, SafaricomApiService],
})
export class SafaricomModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(SafaricomController);
  }
}
