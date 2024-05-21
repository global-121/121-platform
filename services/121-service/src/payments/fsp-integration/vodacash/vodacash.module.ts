import { VodacashService } from '@121-service/src/payments/fsp-integration/vodacash/vodacash.service';
import { TransactionsModule } from '@121-service/src/payments/transactions/transactions.module';
import { RegistrationDataModule } from '@121-service/src/registration/modules/registration-data/registration-data.module';
import { RegistrationsModule } from '@121-service/src/registration/registrations.module';
import { UserModule } from '@121-service/src/user/user.module';
import { FileImportService } from '@121-service/src/utils/file-import/file-import.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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
