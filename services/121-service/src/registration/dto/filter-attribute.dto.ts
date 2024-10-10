import { FilterOperator, PaginateQuery } from 'nestjs-paginate';

export class FilterAttributeDto {
  name: string;
  allowedOperators: FilterOperator[];
  isInteger: boolean;
}

export type PaginationFilter = Exclude<PaginateQuery['filter'], undefined>;
