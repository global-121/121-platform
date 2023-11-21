import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappModule } from '../notifications/whatsapp/whatsapp.module';
import { CommercialBankEthiopiaModule } from '../payments/fsp-integration/commercial-bank-ethiopia/commercial-bank-ethiopia.module';
import { IntersolveVisaWalletEntity } from '../payments/fsp-integration/intersolve-visa/intersolve-visa-wallet.entity';
import { IntersolveVisaModule } from '../payments/fsp-integration/intersolve-visa/intersolve-visa.module';
import { IntersolveIssueVoucherRequestEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherModule } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramFspConfigurationEntity } from '../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../programs/program.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { CronjobService } from './cronjob.service';
import { LastMessageStatusService } from '../notifications/last-message-status.service';
import { TwilioMessageEntity } from '../notifications/twilio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntersolveVoucherEntity,
      ProgramEntity,
      IntersolveIssueVoucherRequestEntity,
      RegistrationEntity,
      TransactionEntity,
      ProgramFspConfigurationEntity,
      IntersolveVisaWalletEntity,
      TwilioMessageEntity,
    ]),
    WhatsappModule,
    IntersolveVoucherModule,
    IntersolveVisaModule,
    CommercialBankEthiopiaModule,
  ],
  providers: [CronjobService, LastMessageStatusService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}
