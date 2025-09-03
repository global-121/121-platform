import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';

export class AggregatePerPayment {
  [paymentNr: number]: PaymentReturnDto;
}

export class AggregatePerMonth {
  [month: string]: {
    success: number;
    waiting: number;
    failed: number;
  };
}
