import { FilterOperator, FilterSuffix } from 'nestjs-paginate';

export class FilterAttributeDto {
  name: string;
  allowedOperators: (FilterOperator | FilterSuffix)[];
  isInteger: boolean;
}
