import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { RegistrationEntity } from '../../../registration/registration.entity';

import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { BobFinanceService } from './bob-finance.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, RegistrationEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [BobFinanceService, LookupService],
  controllers: [],
  exports: [BobFinanceService],
})
export class BobFinanceModule {}
