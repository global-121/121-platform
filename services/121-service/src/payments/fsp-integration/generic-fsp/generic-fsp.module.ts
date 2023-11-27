import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupService } from '../../../notifications/lookup/lookup.service';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { GenericFspService } from './generic-fsp.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [GenericFspService, LookupService],
  controllers: [],
  exports: [GenericFspService],
})
export class GenericFspModule {}
