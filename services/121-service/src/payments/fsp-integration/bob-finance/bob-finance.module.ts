import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { BobFinanceService } from './bob-finance.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [BobFinanceService],
  controllers: [],
  exports: [BobFinanceService],
})
export class BobFinanceModule {}
