import { FilterOperator, FilterSuffix, PaginateConfig } from 'nestjs-paginate';

import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';

type FilterOperatorOrSuffix = FilterOperator | FilterSuffix;

export const AllowedFiltersString: FilterOperatorOrSuffix[] = [
  FilterOperator.EQ,
  FilterOperator.IN,
  FilterOperator.ILIKE,
  FilterOperator.NULL,
  FilterSuffix.NOT,
];

export const AllowedFiltersNumber: FilterOperatorOrSuffix[] = [
  FilterOperator.EQ,
  FilterOperator.NULL,
  FilterOperator.GT,
  FilterOperator.LT,
  FilterOperator.BTW,
  FilterSuffix.NOT,
];

const dataSearchableColumn = 'data.value';
export const PaginateConfigRegistrationView: PaginateConfig<RegistrationViewEntity> =
  {
    searchableColumns: [dataSearchableColumn],
    ignoreSearchByInQueryParam: true,
    maxLimit: 40000,
    sortableColumns: [
      'id',
      'created',
      'status',
      'referenceId',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'fspName',
      'projectFspConfigurationName',
      'registrationProjectId',
      'personAffectedSequence',
      'maxPayments',
      'paymentCount',
      'paymentCountRemaining',
      'lastMessageStatus',
      'duplicateStatus',
      'data.value',
    ],
    filterableColumns: {
      referenceId: AllowedFiltersString,
      status: AllowedFiltersString,
      id: AllowedFiltersNumber,
      created: AllowedFiltersNumber,
      phoneNumber: AllowedFiltersString,
      preferredLanguage: AllowedFiltersString,
      inclusionScore: AllowedFiltersNumber,
      paymentAmountMultiplier: AllowedFiltersNumber,
      fspName: AllowedFiltersString,
      projectFspConfigurationName: AllowedFiltersString,
      projectFspConfigurationLabel: AllowedFiltersString,
      registrationProjectId: AllowedFiltersNumber,
      maxPayments: AllowedFiltersNumber,
      paymentCount: AllowedFiltersNumber,
      paymentCountRemaining: AllowedFiltersNumber,
      personAffectedSequence: AllowedFiltersString,
      lastMessageStatus: AllowedFiltersString,
      duplicateStatus: AllowedFiltersString,
    },
  };

// Define the object with additional filterable columns
// This is the object that is used in the controller for swagger documentation
// This is because we wrote custom code to handle the additional filterable columns

export const PaginateConfigRegistrationViewOnlyFilters: PaginateConfig<RegistrationViewEntity> =
  {
    filterableColumns: {
      ...PaginateConfigRegistrationView.filterableColumns,
    },
    sortableColumns: [],
    maxLimit: 0,
    searchableColumns: [dataSearchableColumn],
  };

export const PaginateConfigRegistrationWithoutSort: PaginateConfig<RegistrationViewEntity> =
  {
    ...PaginateConfigRegistrationView,
    sortableColumns: [],
  };

export const PaginateConfigRegistrationViewNoLimit: PaginateConfig<RegistrationViewEntity> =
  {
    ...PaginateConfigRegistrationView,
    maxLimit: 0,
  };
