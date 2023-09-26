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

export const PaginateConfigRegistrationView: PaginateConfig<RegistrationViewEntity> =
  {
    maxLimit: 10000,
    sortableColumns: [
      'id',
      'status',
      'referenceId',
      'phoneNumber',
      'preferredLanguage',
      'inclusionScore',
      'paymentAmountMultiplier',
      'note',
      'noteUpdated',
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
      phoneNumber: AllowedFilterOperatorsString,
      preferredLanguage: AllowedFilterOperatorsString,
      inclusionScore: AllowedFilterOperatorsNumber,
      paymentAmountMultiplier: AllowedFilterOperatorsNumber,
      note: AllowedFilterOperatorsString,
      noteUpdated: AllowedFilterOperatorsNumber,
      financialServiceProvider: AllowedFilterOperatorsString,
      fspDisplayNamePortal: AllowedFilterOperatorsString,
      registrationProgramId: AllowedFilterOperatorsNumber,
      maxPayments: AllowedFilterOperatorsNumber,
      paymentCount: AllowedFilterOperatorsNumber,
      paymentCountRemaining: AllowedFilterOperatorsNumber,
      personAffectedSequence: AllowedFilterOperatorsString,
      lastMessageStatus: AllowedFilterOperatorsString,
      failedPayment: AllowedFilterOperatorsNumber,
      waitingPayment: AllowedFilterOperatorsNumber,
      successPayment: AllowedFilterOperatorsNumber,
    },
  };
