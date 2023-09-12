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

export enum RegistrationViewColumnsEnum {
  id = 'id',
  status = 'status',
  referenceId = 'referenceId',
  phoneNumber = 'phoneNumber',
  preferredLanguage = 'preferredLanguage',
  inclusionScore = 'inclusionScore',
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  note = 'note',
  noteUpdated = 'noteUpdated',
  financialServiceProvider = 'financialServiceProvider',
  registrationProgramId = 'registrationProgramId',
  personAffectedSequence = 'personAffectedSequence',
  maxPayments = 'maxPayments',
  name = 'name',
}

export const PaginateConfigRegistrationView: PaginateConfig<RegistrationViewEntity> =
  {
    maxLimit: 10000,
    sortableColumns: [
      RegistrationViewColumnsEnum.id,
      RegistrationViewColumnsEnum.status,
      RegistrationViewColumnsEnum.referenceId,
      RegistrationViewColumnsEnum.phoneNumber,
      RegistrationViewColumnsEnum.preferredLanguage,
      RegistrationViewColumnsEnum.inclusionScore,
      RegistrationViewColumnsEnum.paymentAmountMultiplier,
      RegistrationViewColumnsEnum.note,
      RegistrationViewColumnsEnum.noteUpdated,
      RegistrationViewColumnsEnum.financialServiceProvider,
      RegistrationViewColumnsEnum.registrationProgramId,
      RegistrationViewColumnsEnum.personAffectedSequence,
      RegistrationViewColumnsEnum.maxPayments,
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
      personAffectedSequence: AllowedFilterOperatorsString,
    },
  };
