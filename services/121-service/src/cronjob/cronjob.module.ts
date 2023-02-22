import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappModule } from '../notifications/whatsapp/whatsapp.module';
import { IntersolveIssueVoucherRequestEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-issue-voucher-request.entity';
import { IntersolveVoucherEntity } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { IntersolveVoucherModule } from '../payments/fsp-integration/intersolve-voucher/intersolve-voucher.module';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramEntity } from '../programs/program.entity';
import { RegistrationEntity } from './../registration/registration.entity';
import { CronjobService } from './cronjob.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IntersolveVoucherEntity,
      ProgramEntity,
      IntersolveIssueVoucherRequestEntity,
      RegistrationEntity,
      TransactionEntity,
    ]),
    WhatsappModule,
    IntersolveVoucherModule,
  ],
  providers: [CronjobService],
  controllers: [],
  exports: [CronjobService],
})
export class CronjobModule {}
