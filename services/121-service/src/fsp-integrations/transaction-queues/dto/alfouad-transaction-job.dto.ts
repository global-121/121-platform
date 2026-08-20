import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';

export interface AlfouadTransactionJobDto extends SharedTransactionJobDto {
  readonly beneficiaryFullName: string;
  readonly beneficiaryPhoneNumber: string;
}
