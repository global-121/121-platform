import { GetPaymentsDto } from '@121-service/src/payments/dto/get-payments.dto';
import { PaymentReturnDto } from '@121-service/src/payments/dto/payment-return.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';

import { Dto } from '~/utils/dto-type';

export type Payment = Dto<GetPaymentsDto>;
export type PaymentAggregate = Dto<PaymentReturnDto>;
export type PaymentStatus = Dto<ProgramPaymentsStatusDto>;

// TODO: import interface from 121-service, see also transactions.model.ts
interface PaymentEventInterface {
  id: string;
  user: {
    id?: number;
    username?: string;
  };
  created: Date;
  type: PaymentEvent;
  attributes: Record<string, unknown>;
}
export type PaymentEventType = Dto<PaymentEventInterface>;

export type PaymentEventsResponse = {
  data: PaymentEventType[];
} & Dto<Omit<PaymentEventsReturnDto, 'data'>>;
