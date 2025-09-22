import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface OnafriqTransactionJobDto extends SharedTransactionJobDto {
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumberPayment: string;
}
