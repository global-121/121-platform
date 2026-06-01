import { FilterOperator, FilterSuffix, PaginateConfig } from 'nestjs-paginate';

import { DEFAULT_PAGINATION_LIMIT } from '@121-service/src/config';
import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';
import {
    AllowedFiltersNumber,
    AllowedFiltersString,
} from '@121-service/src/registration/const/filter-operation.const';

type FilterOperatorOrSuffix = FilterOperator | FilterSuffix;

const filterableColumns = {
  noOfCardsOrdered: AllowedFiltersNumber,
  addressee: AllowedFiltersString,
  address: AllowedFiltersString,
  postalCode: AllowedFiltersString,
  city: AllowedFiltersString,
  created: AllowedFiltersNumber,
  'user.username': AllowedFiltersString,
} as Record<string, FilterOperatorOrSuffix[]>;

const sortableColumns = [
  'noOfCardsOrdered',
  'address',
  'created',
  'user.username',
] as (keyof VisaCardOrderEntity)[];

const searchableColumns = [
  'addressee',
  'address',
  'postalCode',
  'city',
  'user.username',
] as (keyof VisaCardOrderEntity)[];

export const PaginateConfigVisaCardOrder: PaginateConfig<VisaCardOrderEntity> =
  {
    defaultLimit: DEFAULT_PAGINATION_LIMIT,
    maxLimit: -1,
    sortableColumns,
    filterableColumns,
    searchableColumns,
    defaultSortBy: [['created', 'DESC']],
  };
