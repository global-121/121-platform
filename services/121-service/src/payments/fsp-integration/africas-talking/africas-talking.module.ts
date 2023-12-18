import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AzureLoggerMiddleware } from '../../../shared/middleware/azure-logger.middleware';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { AfricasTalkingNotificationEntity } from './africas-talking-notification.entity';
import { AfricasTalkingApiService } from './africas-talking.api.service';
import { AfricasTalkingController } from './africas-talking.controller';
import { AfricasTalkingService } from './africas-talking.service';

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
