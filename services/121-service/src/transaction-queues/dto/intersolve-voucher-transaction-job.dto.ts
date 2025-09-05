import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface IntersolveVoucherTransactionJobDto
  extends SharedTransactionJobDto {
  readonly transactionAmount: number;
  readonly useWhatsapp: boolean;
  readonly whatsappPhoneNumber: string;
}
