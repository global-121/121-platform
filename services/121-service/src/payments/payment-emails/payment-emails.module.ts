import { Module } from '@nestjs/common';

import { EmailsModule } from '@121-service/src/emails/emails.module';
import { PaymentEmailsService } from '@121-service/src/payments/payment-emails/payment-emails.service';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

@Module({
  imports: [EmailsModule],
  providers: [PaymentEmailsService, AzureLogService],
  exports: [PaymentEmailsService],
})
export class PaymentEmailsModule {}
