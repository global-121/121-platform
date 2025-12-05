import { FilterOperator, FilterSuffix, PaginateConfig } from 'nestjs-paginate';

import {
  AllowedFiltersNumber,
  AllowedFiltersString,
} from '@121-service/src/registration/const/filter-operation.const';
import { RegistrationEventViewEntity } from '@121-service/src/registration-events/entities/registration-event.view.entity';

type FilterOperatorOrSuffix = FilterOperator | FilterSuffix;

const filterableColumns: Partial<{
  [key in keyof RegistrationEventViewEntity]: FilterOperatorOrSuffix[];
}> = {
  id: AllowedFiltersNumber,
  registrationProgramId: AllowedFiltersNumber,
  programId: AllowedFiltersNumber,
  fieldChanged: AllowedFiltersString,
  oldValue: AllowedFiltersString,
  newValue: AllowedFiltersString,
  reason: AllowedFiltersString,
};

const maxLimit = -1; // No limit

const columns = Object.keys(
  filterableColumns,
) as (keyof RegistrationEventViewEntity)[];
export const PaginateConfigRegistrationEventView: PaginateConfig<RegistrationEventViewEntity> =
  {
    searchableColumns: columns.filter((col) =>
      filterableColumns[col]?.includes(FilterOperator.ILIKE),
    ),
    ignoreSearchByInQueryParam: true,
    maxLimit,
    sortableColumns: columns,
    filterableColumns,
  };
