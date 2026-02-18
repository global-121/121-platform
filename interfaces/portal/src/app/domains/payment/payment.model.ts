import { PaymentAggregationFullDto } from '@121-service/src/payments/dto/payment-aggregation-full.dto';
import { PaymentAggregationSummaryDto } from '@121-service/src/payments/dto/payment-aggregation-summary.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentEventInterface } from '@121-service/src/payments/payment-events/interfaces/payment-event.interface';

import { Dto } from '~/utils/dto-type';

export type PaymentAggregationSummary = Dto<PaymentAggregationSummaryDto>;
export type PaymentAggregationFull = Dto<PaymentAggregationFullDto>;
export type PaymentStatus = Dto<ProgramPaymentsStatusDto>;

export type PaymentEventType = Dto<PaymentEventInterface>;
export type PaymentEventsResponse = {
  data: PaymentEventType[];
} & Dto<Omit<PaymentEventsReturnDto, 'data'>>;
