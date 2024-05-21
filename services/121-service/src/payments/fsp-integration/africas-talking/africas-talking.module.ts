import { AfricasTalkingNotificationEntity } from '@121-service/src/payments/fsp-integration/africas-talking/africas-talking-notification.entity';
import { AfricasTalkingApiService } from '@121-service/src/payments/fsp-integration/africas-talking/africas-talking.api.service';
import { AfricasTalkingController } from '@121-service/src/payments/fsp-integration/africas-talking/africas-talking.controller';
import { AfricasTalkingService } from '@121-service/src/payments/fsp-integration/africas-talking/africas-talking.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { UserModule } from '@121-service/src/user/user.module';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([AfricasTalkingNotificationEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [AfricasTalkingService, AfricasTalkingApiService],
  controllers: [AfricasTalkingController],
  exports: [AfricasTalkingService, AfricasTalkingApiService],
})
export class AfricasTalkingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(AfricasTalkingController);
  }
}
