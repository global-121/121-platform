import { PaymentReturnDto } from '@121-service/src/payments/dto/payment-return.dto';

export class AggregatePerPayment {
  id: number;
  date: Date;
  aggregatedStatuses: PaymentReturnDto;
}

export class AggregatePerMonth {
  [month: string]: {
    success: number;
    waiting: number;
    failed: number;
    created: number;
  };
}
