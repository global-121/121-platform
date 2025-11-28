import { Paginated } from 'nestjs-paginate';

import { PaginatedTransactionDto } from '@121-service/src/payments/dto/paginated-transaction.dto';

export type FindAllTransactionsResultDto = Omit<
  Paginated<PaginatedTransactionDto>,
  'data'
> & { data: PaginatedTransactionDto[] };
