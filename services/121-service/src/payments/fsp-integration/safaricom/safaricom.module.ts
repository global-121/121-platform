import { PaymentProcessorSafaricom } from '@121-service/src/payments/fsp-integration/safaricom/processors/safaricom.processor';
import { SafaricomRequestEntity } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-request.entity';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomController } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.controller';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
