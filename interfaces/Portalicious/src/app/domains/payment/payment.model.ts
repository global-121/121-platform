import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';

import { Dto } from '~/utils/dto-type';

// TODO: AB#30152 This type should be refactored to use Dto121Service
export interface Payment {
  payment: number;
  paymentDate: string;
  amount: number;
}

export type PaymentAggregate = Dto<PaymentReturnDto>;
