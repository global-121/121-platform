import { PaymentJobCreationDetails } from '@121-service/src/payments/interfaces/payment-job-creation-details.interface';

export interface RetryPaymentJobCreationDetails
  extends PaymentJobCreationDetails {
  programFspConfigurationName: string;
}
