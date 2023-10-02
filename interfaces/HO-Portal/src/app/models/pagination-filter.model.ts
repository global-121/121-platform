export class PaginationFilter {
  value: string;
  name: string;
  operator?: FilterOperatorEnum;
}

export class PaginationSort {
  column: string;
  direction: SortDirectionEnum;
}

export enum SortDirectionEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum FilterOperatorEnum {
  eq = '$eq',
  in = '$in',
  ilike = '$ilike',
  null = '$null',
}
