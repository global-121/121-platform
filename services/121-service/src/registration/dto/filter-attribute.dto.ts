import { FilterOperator } from 'nestjs-paginate';

export class FilterAttributeDto {
  name: string;
  allowedOperators: FilterOperator[];
  isInteger: boolean;
}
