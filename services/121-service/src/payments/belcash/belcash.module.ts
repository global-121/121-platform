import { TransactionsModule } from '../transactions/transactions.module';
import { BelcashService } from './belcash.service';
import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BelcashApiService } from './belcash.api.service';
import { UserModule } from '../../user/user.module';
import { UserEntity } from '../../user/user.entity';

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
