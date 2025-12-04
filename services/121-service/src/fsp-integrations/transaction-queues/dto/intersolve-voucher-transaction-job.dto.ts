import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';

export interface IntersolveVoucherTransactionJobDto
  extends SharedTransactionJobDto {
  readonly useWhatsapp: boolean;
  readonly whatsappPhoneNumber: string;
}
