import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface IntersolveVisaTransactionJobDto
  extends SharedTransactionJobDto {
  readonly phoneNumber: string;
  readonly name: string;
  readonly addressStreet: string;
  readonly addressHouseNumber: string;
  readonly addressHouseNumberAddition: string;
  readonly addressPostalCode?: string;
  readonly addressCity: string;
}
