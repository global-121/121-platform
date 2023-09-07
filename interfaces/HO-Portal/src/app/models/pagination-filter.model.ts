export class PaginationFilter {
  value: string;
  name: string;
  operator?: FilterOperatorEnum;
}

export enum FilterOperatorEnum {
  eq = 'eq',
  in = 'in',
  ilike = 'ilike',
  null = 'null',
}
