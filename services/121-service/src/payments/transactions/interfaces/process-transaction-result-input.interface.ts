import { PaymentJobCreationDetails } from '@121-service/src/payments/interfaces/payment-job-creation-details.interface';

export interface ProcessTransactionResultInput {
  paymentJobCreationDetailsItem: PaymentJobCreationDetails;
  programId: number;
  paymentId: number;
  userId: number;
  isRetry: boolean;
  bulkSize: number;
}
