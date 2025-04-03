import { FilterOperator, PaginateConfig } from 'nestjs-paginate';

import { RegistrationViewEntity } from '@121-service/src/registration/registration-view.entity';

export const AllowedFilterOperatorsString = [
  FilterOperator.EQ,
  FilterOperator.IN,
  FilterOperator.ILIKE,
  FilterOperator.NULL,
];

export const AllowedFilterOperatorsNumber = [
  FilterOperator.EQ,
  FilterOperator.NULL,
  FilterOperator.GT,
  FilterOperator.LT,
  FilterOperator.BTW,
];

// TODO: This can be removed after we remove the old portal
export const AllowedFilterOperatorsPayment = [
  FilterOperator.EQ,
  FilterOperator.NULL,
];

const dataSearchableColumn = 'data.value';
const basePaginateConfigRegistrationView: PaginateConfig<RegistrationViewEntity> =
  {
    searchableColumns: [dataSearchableColumn],
    ignoreSearchByInQueryParam: true,
    maxLimit: 40000,
    sortableColumns: [
      'id',
      'created',
      'registrationCreatedDate',
      'status',
      'referenceId',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'financialServiceProviderName',
      'programFinancialServiceProviderConfigurationName',
      'registrationProgramId',
      'personAffectedSequence',
      'maxPayments',
      'paymentCount',
      'paymentCountRemaining',
      'lastMessageStatus',
      'duplicateStatus',
      'data.value',
    ],
    filterableColumns: {
      referenceId: AllowedFilterOperatorsString,
      status: AllowedFilterOperatorsString,
      id: AllowedFilterOperatorsNumber,
      registrationCreatedDate: AllowedFilterOperatorsString,
      created: AllowedFilterOperatorsNumber,
      phoneNumber: AllowedFilterOperatorsString,
      preferredLanguage: AllowedFilterOperatorsString,
      inclusionScore: AllowedFilterOperatorsNumber,
      paymentAmountMultiplier: AllowedFilterOperatorsNumber,
      financialServiceProviderName: AllowedFilterOperatorsString,
      programFinancialServiceProviderConfigurationName:
        AllowedFilterOperatorsString,
      programFinancialServiceProviderConfigurationLabel:
        AllowedFilterOperatorsString,
      registrationProgramId: AllowedFilterOperatorsNumber,
      maxPayments: AllowedFilterOperatorsNumber,
      paymentCount: AllowedFilterOperatorsNumber,
      paymentCountRemaining: AllowedFilterOperatorsNumber,
      personAffectedSequence: AllowedFilterOperatorsString,
      lastMessageStatus: AllowedFilterOperatorsString,
      duplicateStatus: AllowedFilterOperatorsString,
    },
  };

// Define the object with additional filterable columns
// This is the object that is used in the controller for swagger documentation
// This is because we wrote custom code to handle the additional filterable columns
const PaginateConfigRegistrationViewWithPayments: PaginateConfig<RegistrationViewEntity> =
  {
    ...basePaginateConfigRegistrationView,
    filterableColumns: {
      ...basePaginateConfigRegistrationView.filterableColumns,
      failedPayment: AllowedFilterOperatorsPayment,
      waitingPayment: AllowedFilterOperatorsPayment,
      successPayment: AllowedFilterOperatorsPayment,
      notYetSentPayment: AllowedFilterOperatorsPayment,
    },
  };

const PaginateConfigRegistrationViewOnlyFilters: PaginateConfig<RegistrationViewEntity> =
  {
    filterableColumns: {
      ...PaginateConfigRegistrationViewWithPayments.filterableColumns,
    },
    sortableColumns: [],
    maxLimit: 0,
    searchableColumns: [dataSearchableColumn],
  };

// Define the object without additional filterable columns
const PaginateConfigRegistrationView: PaginateConfig<RegistrationViewEntity> = {
  ...basePaginateConfigRegistrationView,
};

const PaginateConfigRegistrationViewNoLimit: PaginateConfig<RegistrationViewEntity> =
  {
    ...PaginateConfigRegistrationView,
    maxLimit: 0,
  };

export {
  PaginateConfigRegistrationView,
  PaginateConfigRegistrationViewNoLimit,
  PaginateConfigRegistrationViewOnlyFilters,
  PaginateConfigRegistrationViewWithPayments,
};
