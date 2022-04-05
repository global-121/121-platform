import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupService } from '../../../notifications/lookup/lookup.service';

import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { UkrPoshtaService } from './ukrposhta.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [UkrPoshtaService, LookupService],
  controllers: [],
  exports: [UkrPoshtaService],
})
export class UkrPoshtaModule {}
