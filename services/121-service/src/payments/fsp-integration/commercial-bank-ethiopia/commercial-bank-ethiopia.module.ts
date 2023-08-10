import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappModule } from '../../../notifications/whatsapp/whatsapp.module';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { CustomHttpService } from '../../../shared/services/custom-http.service';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { SoapService } from '../../../utils/soap/soap.service';
import { ImageCodeModule } from '../../imagecode/image-code.module';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsModule } from '../../transactions/transactions.module';
import { CommercialBankEthiopiaApiService } from './commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaController } from './commercial-bank-ethiopia.controller';
import { CommercialBankEthiopiaMockService } from './commercial-bank-ethiopia.mock';
import { CommercialBankEthiopiaService } from './commercial-bank-ethiopia.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      RegistrationEntity,
      TransactionEntity,
      ProgramEntity,
      UserEntity,
    ]),
    ImageCodeModule,
    UserModule,
    TransactionsModule,
    WhatsappModule,
  ],
  providers: [
    CommercialBankEthiopiaService,
    CommercialBankEthiopiaApiService,
    SoapService,
    CommercialBankEthiopiaMockService,
    CustomHttpService,
  ],
  controllers: [CommercialBankEthiopiaController],
  exports: [
    CommercialBankEthiopiaApiService,
    CommercialBankEthiopiaMockService,
    CommercialBankEthiopiaService,
  ],
})
export class CommercialBankEthiopiaModule {}
