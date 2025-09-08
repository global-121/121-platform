import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';

export interface IntersolveVisaTransactionJobDto
  extends SharedTransactionJobDto {
  readonly transactionAmountInMajorUnit: number; // This is in the major unit of the currency, for example whole euros
  readonly phoneNumber: string;
  readonly name: string;
  readonly addressStreet: string;
  readonly addressHouseNumber: string;
  readonly addressHouseNumberAddition: string;
  readonly addressPostalCode?: string;
  readonly addressCity: string;
  readonly phoneNumber: string;
}
