import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappModule } from '../../../notifications/whatsapp/whatsapp.module';
import { ProgramEntity } from '../../../programs/program.entity';
import { RegistrationEntity } from '../../../registration/registration.entity';
import { UserEntity } from '../../../user/user.entity';
import { UserModule } from '../../../user/user.module';
import { SoapService } from '../../../utils/soap/soap.service';
import { ImageCodeModule } from '../../imagecode/image-code.module';
import { TransactionEntity } from '../../transactions/transaction.entity';
import { TransactionsModule } from '../../transactions/transactions.module';
import { IntersolveVoucherApiService } from './instersolve-voucher.api.service';
import { IntersolveVoucherMockService } from './instersolve-voucher.mock';
import { IntersolveIssueVoucherRequestEntity } from './intersolve-issue-voucher-request.entity';
import { IntersolveVoucherInstructionsEntity } from './intersolve-voucher-instructions.entity';
import { IntersolveVoucherController } from './intersolve-voucher.controller';
import { IntersolveVoucherEntity } from './intersolve-voucher.entity';
import { IntersolveVoucherService } from './intersolve-voucher.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      IntersolveVoucherEntity,
      IntersolveIssueVoucherRequestEntity,
      IntersolveVoucherInstructionsEntity,
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
    IntersolveVoucherService,
    IntersolveVoucherApiService,
    SoapService,
    IntersolveVoucherMockService,
  ],
  controllers: [IntersolveVoucherController],
  exports: [
    IntersolveVoucherService,
    IntersolveVoucherApiService,
    IntersolveVoucherMockService,
  ],
})
export class IntersolveVoucherModule {}
