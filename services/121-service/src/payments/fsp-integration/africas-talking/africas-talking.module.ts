import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { AfricasTalkingNotificationEntity } from './africas-talking-notification.entity';
import { AfricasTalkingApiService } from './africas-talking.api.service';
import { AfricasTalkingController } from './africas-talking.controller';
import { AfricasTalkingService } from './africas-talking.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([AfricasTalkingNotificationEntity, UserEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [AfricasTalkingService, AfricasTalkingApiService],
  controllers: [AfricasTalkingController],
  exports: [AfricasTalkingService, AfricasTalkingApiService],
})
export class AfricasTalkingModule {}
