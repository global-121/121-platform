import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../../../payments/redis.module';
import { TransactionEntity } from '../../../payments/transactions/transaction.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { AzureLoggerMiddleware } from '../../../shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserModule } from '../../../user/user.module';
import { QueueNamePayment } from '../../enum/queue.names.enum';
import { TransactionsModule } from '../../transactions/transactions.module';
import { PaymentProcessorSafaricom } from './processors/safaricom.processor';
import { SafaricomRequestEntity } from './safaricom-request.entity';
import { SafaricomApiService } from './safaricom.api.service';
import { SafaricomController } from './safaricom.controller';
import { SafaricomService } from './safaricom.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      TransactionEntity,
      RegistrationEntity,
      SafaricomRequestEntity,
    ]),
    UserModule,
    TransactionsModule,
    BullModule.registerQueue({
      name: QueueNamePayment.paymentSafaricom,
      processors: [
        {
          path: 'src/payments/fsp-integration/safaricom/processors/safaricom.processor.ts',
        },
      ],
      limiter: {
        max: 5, // Max number of jobs processed
        duration: 1000, // per duration in milliseconds
      },
    }),
    RedisModule,
  ],
  providers: [
    SafaricomService,
    SafaricomApiService,
    CustomHttpService,
    PaymentProcessorSafaricom,
  ],
  controllers: [SafaricomController],
  exports: [SafaricomService, SafaricomApiService],
})
export class SafaricomModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(SafaricomController);
  }
}
