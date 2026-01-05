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
  type: AllowedFiltersString,
  fieldChanged: AllowedFiltersString,
  reason: AllowedFiltersString,
};

const maxLimit = -1; // No limit

const filterableColumnNames = Object.keys(filterableColumns);
const sortableColumnNames = [
  ...filterableColumnNames,
  'created',
] as (keyof RegistrationEventViewEntity)[];
export const PaginateConfigRegistrationEventView: PaginateConfig<RegistrationEventViewEntity> =
  {
    ignoreSearchByInQueryParam: true,
    maxLimit,
    sortableColumns: sortableColumnNames,
    filterableColumns,
  };
