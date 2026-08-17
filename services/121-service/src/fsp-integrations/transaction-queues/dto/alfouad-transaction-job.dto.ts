import { SharedTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/shared-transaction-job.dto';

export interface AlfouadTransactionJobDto extends SharedTransactionJobDto {
  readonly senderFullName: string;
  readonly senderPhoneNumber: string;
  readonly beneficiaryFullName: string;
  readonly beneficiaryPhoneNumber: string;
  readonly countryCode: string;
  readonly cityCode: string;
  readonly deliveryCurrencyCode: string;
  readonly agentCode?: number;
}
