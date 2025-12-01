import { GetPaymentsDto } from '@121-service/src/payments/dto/get-payments.dto';
import { PaymentReturnDto } from '@121-service/src/payments/dto/payment-return.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { PaymentEventDataDto } from '@121-service/src/payments/payment-events/dtos/payment-event-data.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';

import { Dto } from '~/utils/dto-type';

export type Payment = Dto<GetPaymentsDto>;
export type PaymentAggregate = Dto<PaymentReturnDto>;
export type PaymentStatus = Dto<ProgramPaymentsStatusDto>;

export type PaymentEventType = Dto<PaymentEventDataDto>;
export type PaymentEventsResponse = {
  data: PaymentEventType[];
} & Dto<Omit<PaymentEventsReturnDto, 'data'>>;
