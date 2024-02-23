import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationDataModule } from '../../../registration/modules/registration-data/registration-data.module';
import { RegistrationsModule } from '../../../registration/registrations.module';
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
    RegistrationDataModule,
    RegistrationsModule,
  ],
  providers: [VodacashService, FileImportService],
  controllers: [],
  exports: [VodacashService],
})
export class VodacashModule {}
