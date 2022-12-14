import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { TransactionsModule } from '../../transactions/transactions.module';
import { VodacashService } from './vodacash.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, ProgramEntity, RegistrationEntity]),
    UserModule,
    TransactionsModule,
  ],
  providers: [VodacashService],
  controllers: [],
  exports: [VodacashService],
})
export class VodacashModule {}
