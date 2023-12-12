import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramFspConfigurationEntity } from '../../../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserModule } from '../../../user/user.module';
import { SoapService } from '../../../utils/soap/soap.service';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsModule } from '../../transactions/transactions.module';
import { CommercialBankEthiopiaAccountEnquiriesEntity } from './commercial-bank-ethiopia-account-enquiries.entity';
import { CommercialBankEthiopiaApiService } from './commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaController } from './commercial-bank-ethiopia.controller';
import { CommercialBankEthiopiaMockService } from './commercial-bank-ethiopia.mock';
import { CommercialBankEthiopiaService } from './commercial-bank-ethiopia.service';
import { createScopedRepositoryProvider } from '../../../utils/scope/createScopedRepositoryProvider.helper';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      RegistrationEntity,
      TransactionEntity,
      ProgramEntity,
      ProgramFspConfigurationEntity,
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ]),
    TransactionsModule,
    UserModule,
  ],
  providers: [
    CommercialBankEthiopiaService,
    CommercialBankEthiopiaApiService,
    SoapService,
    CommercialBankEthiopiaMockService,
    CustomHttpService,
    createScopedRepositoryProvider(
      CommercialBankEthiopiaAccountEnquiriesEntity,
    ),
  ],
  controllers: [CommercialBankEthiopiaController],
  exports: [
    CommercialBankEthiopiaApiService,
    CommercialBankEthiopiaMockService,
    CommercialBankEthiopiaService,
  ],
})
export class CommercialBankEthiopiaModule {}
