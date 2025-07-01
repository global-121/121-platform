import { FilterOperator, FilterSuffix, PaginateQuery } from 'nestjs-paginate';

export class FilterAttributeDto {
  name: string;
  allowedOperators: (FilterOperator | FilterSuffix)[];
  isInteger: boolean;
}

export type PaginationFilter = Exclude<PaginateQuery['filter'], undefined>;
