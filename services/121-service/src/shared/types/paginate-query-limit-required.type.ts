import { PaginateQuery } from 'nestjs-paginate';
export type PaginateQueryLimitRequired = PaginateQuery & {
  limit: number;
};
