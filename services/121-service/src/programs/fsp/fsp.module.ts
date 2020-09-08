import { Module, HttpModule } from '@nestjs/common';
import { FspService } from './fsp.service';
import { FspController } from './fsp.controller';
import { FspApiService } from './fsp-api.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../program/program.entity';
import { ConnectionEntity } from '../../sovrin/create-connection/connection.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';
import { TransactionEntity } from '../program/transactions.entity';
import { FspCallLogEntity } from './fsp-call-log.entity';
import { AfricasTalkingNotificationEntity } from './africastalking-notification.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      ProgramEntity,
      ConnectionEntity,
      FinancialServiceProviderEntity,
      TransactionEntity,
      FspCallLogEntity,
      AfricasTalkingNotificationEntity,
    ]),
  ],
  providers: [FspService, FspApiService],
  controllers: [FspController],
  exports: [FspService, FspApiService],
})
export class FspModule {}
