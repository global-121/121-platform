import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../../programs/program.entity';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { VodacashRequestEntity } from './vodacash.request.entity';
import { VodacashApiService } from './vodacash.api.service';
import { VodacashController } from './vodacash.controller';
import { VodacashService } from './vodacash.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      UserEntity,
      ProgramEntity,
      VodacashRequestEntity,
    ]),
    UserModule,
    TransactionsModule,
  ],
  providers: [VodacashService, VodacashApiService],
  controllers: [VodacashController],
  exports: [VodacashService, VodacashApiService],
})
export class VodacashModule {}
