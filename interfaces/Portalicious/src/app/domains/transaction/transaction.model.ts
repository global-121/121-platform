import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { Dto } from '~/utils/dto-type';

export type Transaction = Dto<TransactionEntity>;
