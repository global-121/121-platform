import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../../../user/user.module';
import { FileImportService } from '../../../utils/file-import/file-import.service';
import { TransactionsModule } from '../../transactions/transactions.module';
import { VodacashService } from './vodacash.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature(),
    UserModule,
    TransactionsModule,
  ],
  providers: [VodacashService, FileImportService],
  controllers: [],
  exports: [VodacashService],
})
export class VodacashModule {}
