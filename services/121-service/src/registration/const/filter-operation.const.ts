import { FilterOperator, PaginateConfig } from 'nestjs-paginate';
import { RegistrationViewEntity } from '../registration-view.entity';

export const AllowedFilterOperatorsString = [
  FilterOperator.EQ,
  FilterOperator.IN,
  FilterOperator.ILIKE,
  FilterOperator.NULL,
];

export const AllowedFilterOperatorsNumber = [
  FilterOperator.EQ,
  FilterOperator.NULL,
];

const dataSearchableColumn = 'data.(value)';
const basePaginateConfigRegistrationView: PaginateConfig<RegistrationViewEntity> =
  {
    searchableColumns: [dataSearchableColumn],
    ignoreSearchByInQueryParam: true,
    maxLimit: 40000,
    sortableColumns: [
      'id',
      'registrationCreated',
      'status',
      'referenceId',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'financialServiceProvider',
      'registrationProgramId',
      'personAffectedSequence',
      'maxPayments',
      'paymentCount',
      'paymentCountRemaining',
      'lastMessageStatus',
      'data.(value)',
    ],
    filterableColumns: {
      referenceId: AllowedFilterOperatorsString,
      status: AllowedFilterOperatorsString,
      id: AllowedFilterOperatorsNumber,
      registrationCreatedDate: AllowedFilterOperatorsString,
      phoneNumber: AllowedFilterOperatorsString,
      preferredLanguage: AllowedFilterOperatorsString,
      inclusionScore: AllowedFilterOperatorsNumber,
      paymentAmountMultiplier: AllowedFilterOperatorsNumber,
      financialServiceProvider: AllowedFilterOperatorsString,
      fspDisplayName: AllowedFilterOperatorsString,
      registrationProgramId: AllowedFilterOperatorsNumber,
      maxPayments: AllowedFilterOperatorsNumber,
      paymentCount: AllowedFilterOperatorsNumber,
      paymentCountRemaining: AllowedFilterOperatorsNumber,
      personAffectedSequence: AllowedFilterOperatorsString,
      lastMessageStatus: AllowedFilterOperatorsString,
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
      failedPayment: AllowedFilterOperatorsNumber,
      waitingPayment: AllowedFilterOperatorsNumber,
      successPayment: AllowedFilterOperatorsNumber,
      notYetSentPayment: AllowedFilterOperatorsNumber,
    },
  };

const PaginateConfigRegistrationViewOnlyFilters: PaginateConfig<RegistrationViewEntity> =
  {
    filterableColumns: {
      ...PaginateConfigRegistrationViewWithPayments.filterableColumns,
    },
    sortableColumns: [],
    maxLimit: 0,
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
  PaginateConfigRegistrationViewWithPayments,
  PaginateConfigRegistrationView,
  PaginateConfigRegistrationViewOnlyFilters,
  PaginateConfigRegistrationViewNoLimit,
};
