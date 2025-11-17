import { FilterOperator, FilterSuffix, PaginateConfig } from 'nestjs-paginate';

import { TransactionViewEntity } from '@121-service/src/payments/transactions/entities/transaction-view.entity';
import {
  AllowedFiltersNumber,
  AllowedFiltersString,
} from '@121-service/src/registration/const/filter-operation.const';

type FilterOperatorOrSuffix = FilterOperator | FilterSuffix;

const filterableColumns: Partial<{
  [key in keyof TransactionViewEntity]: FilterOperatorOrSuffix[];
}> = {
  id: AllowedFiltersNumber,
  transferValue: AllowedFiltersNumber,
  userId: AllowedFiltersNumber,
  created: AllowedFiltersNumber,
  updated: AllowedFiltersNumber,
  status: AllowedFiltersString,
  paymentId: AllowedFiltersNumber,
  registrationId: AllowedFiltersNumber,
  programFspConfigurationId: AllowedFiltersNumber,
  programFspConfigurationLabel: AllowedFiltersString,
  programFspConfigurationName: AllowedFiltersString,
  fspName: AllowedFiltersString,
  errorMessage: AllowedFiltersString,
  registrationStatus: AllowedFiltersString,
  registrationReferenceId: AllowedFiltersString,
  registrationProgramId: AllowedFiltersNumber,
  registrationScope: AllowedFiltersString,
};

const maxLimit = -1; // No limit

const columns = Object.keys(
  filterableColumns,
) as (keyof TransactionViewEntity)[];
export const PaginateConfigTransactionView: PaginateConfig<TransactionViewEntity> =
  {
    searchableColumns: columns.filter((col) =>
      filterableColumns[col]?.includes(FilterOperator.ILIKE),
    ),
    ignoreSearchByInQueryParam: true,
    maxLimit,
    sortableColumns: columns,
    filterableColumns,
  };

export const PaginateConfigTransactionViewRetry: PaginateConfig<TransactionViewEntity> =
  {
    searchableColumns: columns.filter((col) =>
      filterableColumns[col]?.includes(FilterOperator.ILIKE),
    ),
    ignoreSearchByInQueryParam: true,
    maxLimit,
    sortableColumns: [],
    filterableColumns,
  };
