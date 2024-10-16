import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export enum CustomDataAttributes {
  phoneNumber = 'phoneNumber',
  whatsappPhoneNumber = 'whatsappPhoneNumber',
  name = 'name',
  nameFirst = 'nameFirst',
  nameLast = 'nameLast',
  firstName = 'firstName',
  lastName = 'lastName',
  fathersName = 'fathersName',
  namePartnerOrganization = 'namePartnerOrganization',
  address = 'address',
  addressNoPostalIndex = 'addressNoPostalIndex',
  oblast = 'oblast',
  raion = 'raion',
  postalIndex = 'postalIndex',
  city = 'city',
  street = 'street',
  house = 'house',
  apartmentOrOffice = 'apartmentOrOffice',
  taxId = 'taxId',
  addressStreet = 'addressStreet',
  addressHouseNumber = 'addressHouseNumber',
  addressHouseNumberAddition = 'addressHouseNumberAddition',
  addressPostalCode = 'addressPostalCode',
  addressCity = 'addressCity',
}

export enum GenericAttributes {
  referenceId = 'referenceId',
  phoneNumber = 'phoneNumber',
  preferredLanguage = 'preferredLanguage',
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  fspName = 'fspName',
  maxPayments = 'maxPayments',
  paymentCount = 'paymentCount',
  scope = 'scope',
  status = 'status',
  registrationProgramId = 'registrationProgramId',
  fspDisplayName = 'fspDisplayName',
  registrationCreatedDate = 'registrationCreatedDate',
}

export class Attribute {
  public id?: number;
  public name: string;
  // TODO: AB#30519 type should not be "string" after the refactor
  // public type: AnswerTypes;
  public type: string;
  public label: LocalizedString | null;
  public options?: QuestionOption[] | null;
  public questionType?: QuestionType; // TODO: remove this in after implementing pagination
  public fspNames?: FinancialServiceProviderName[];
  public questionTypes?: QuestionType[];
  public pattern?: string | null;
}

export type AttributeWithOptionalLabel = Omit<Attribute, 'label'> &
  Partial<Pick<Attribute, 'label'>>;

export enum QuestionType {
  programQuestion = 'programQuestion',
  fspQuestion = 'fspQuestion',
  programCustomAttribute = 'programCustomAttribute',
}

export enum AnswerTypes {
  tel = 'tel',
  dropdown = 'dropdown',
  numeric = 'numeric',
  numericNullable = 'numeric-nullable',
  text = 'text',
  date = 'date',
  multiSelect = 'multi-select',
}

export enum CustomAttributeType {
  boolean = 'boolean',
  text = 'text',
}
