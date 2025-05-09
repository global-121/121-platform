import { GetPaymentsDto } from '@121-service/src/payments/dto/get-payments.dto';
import { ProgramPaymentsStatusDto } from '@121-service/src/payments/dto/program-payments-status.dto';
import { TransactionResponseDto } from '@121-service/src/payments/dto/transaction-response.dto';
import { PaymentReturnDto } from '@121-service/src/payments/transactions/dto/get-transaction.dto';

import { Dto } from '~/utils/dto-type';

export type Payment = Dto<GetPaymentsDto>;
export type PaymentAggregate = Dto<PaymentReturnDto>;
export type PaymentStatus = Dto<ProgramPaymentsStatusDto>;
export type PaymentTransaction = Dto<TransactionResponseDto>;
