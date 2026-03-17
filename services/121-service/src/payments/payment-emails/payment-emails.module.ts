import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { PaymentEmailsService } from '@121-service/src/payments/payment-emails/payment-emails.service';

@Module({
  imports: [EmailsModule],
  providers: [PaymentEmailsService],
  exports: [PaymentEmailsService],
})
export class PaymentEmailsModule {}
