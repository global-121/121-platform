import { QueueNamePayment } from '@121-service/src/payments/enum/queue.names.enum';
import { OnafriqRequestEntity } from '@121-service/src/payments/fsp-integration/onafriq/onafriq-request.entity';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.api.service';
import { OnafriqController } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.controller';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/onafriq.service';
import { PaymentProcessorOnafriq } from '@121-service/src/payments/fsp-integration/onafriq/processors/onafriq.processor';
import { RedisModule } from '@121-service/src/payments/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
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
      OnafriqRequestEntity,
    ]),
    UserModule,
    TransactionsModule,
    BullModule.registerQueue({
      name: QueueNamePayment.paymentOnafriq,
      processors: [
        {
          path: 'src/payments/fsp-integration/onafriq/processors/onafriq.processor.ts',
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
    OnafriqService,
    OnafriqApiService,
    CustomHttpService,
    PaymentProcessorOnafriq,
  ],
  controllers: [OnafriqController],
  exports: [OnafriqService, OnafriqApiService],
})
export class OnafriqModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(OnafriqController);
  }
}
