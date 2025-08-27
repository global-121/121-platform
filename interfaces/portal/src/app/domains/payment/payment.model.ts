import { GetPaymentsDto } from '@121-service/src/payments/dto/get-payments.dto';
import { GetTransactionResponseDto } from '@121-service/src/payments/dto/get-transaction-response.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';
import { PaymentEventsReturnDto } from '@121-service/src/payments/payment-events/dtos/payment-events-return.dto';
import { PaymentLogEvent } from '~/pages/project-payment-log/project-payment-log.page';

import { Dto } from '~/utils/dto-type';

export type Payment = Dto<GetPaymentsDto>;
export type PaymentAggregate = Dto<PaymentReturnDto>;
export type PaymentStatus = Dto<ProgramPaymentsStatusDto>;
export type PaymentTransaction = Dto<GetTransactionResponseDto>;

export type PaymentEventsResponse = {
  data: PaymentLogEvent[];
} & Dto<Omit<PaymentEventsReturnDto, 'data'>>;
