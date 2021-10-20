import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { BelcashApiService } from './belcash.api.service';
import { BelcashService } from './belcash.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [BelcashService, BelcashApiService],
  controllers: [],
  exports: [BelcashService, BelcashApiService],
})
export class BelcashModule {}
