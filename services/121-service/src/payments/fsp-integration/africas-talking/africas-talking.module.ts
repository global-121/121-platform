import { TransactionsModule } from '../../transactions/transactions.module';
import { AfricasTalkingService } from './africas-talking.service';
import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfricasTalkingNotificationEntity } from './africas-talking-notification.entity';
import { AfricasTalkingController } from './africas-talking.controller';
import { AfricasTalkingApiService } from './africas-talking.api.service';
import { UserModule } from '../../../user/user.module';
import { UserEntity } from '../../../user/user.entity';

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
