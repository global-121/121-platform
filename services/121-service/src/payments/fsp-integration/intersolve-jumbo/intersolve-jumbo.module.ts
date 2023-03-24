import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappModule } from '../../../notifications/whatsapp/whatsapp.module';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { ImageCodeModule } from '../../imagecode/image-code.module';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsModule } from '../../transactions/transactions.module';
import { SoapService } from './../../../utils/soap/soap.service';
import { IntersolveJumboApiService } from './intersolve-jumbo.api.service';
import { IntersolveJumboMockService } from './intersolve-jumbo.mock';
import { IntersolveJumboService } from './intersolve-jumbo.service';

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
    IntersolveJumboService,
    IntersolveJumboApiService,
    IntersolveJumboMockService,
    SoapService,
  ],
  exports: [IntersolveJumboService],
})
export class IntersolveJumboModule {}
