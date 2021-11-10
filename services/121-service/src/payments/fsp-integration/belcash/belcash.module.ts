import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../../programs/program.entity';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { BelcashRequestEntity } from './belcash-request.entity';
import { BelcashApiService } from './belcash.api.service';
import { BelcashController } from './belcash.controller';
import { BelcashService } from './belcash.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, ProgramEntity, BelcashRequestEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [BelcashService, BelcashApiService],
  controllers: [BelcashController],
  exports: [BelcashService, BelcashApiService],
})
export class BelcashModule {}
