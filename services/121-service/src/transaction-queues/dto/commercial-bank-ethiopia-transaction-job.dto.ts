import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface CommercialBankEthiopiaTransactionJobDto
  extends SharedTransactionJobDto {
  bankAccountNumber: string;
  fullName: string;
  debitTheirRef?: string;
}
