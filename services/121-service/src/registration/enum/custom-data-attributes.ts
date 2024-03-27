import { FspName } from '../../fsp/enum/fsp-name.enum';

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
  scope = 'scope',
  status = 'status',
  registrationProgramId = 'registrationProgramId',
  fspDisplayName = 'fspDisplayName',
  registrationCreatedDate = 'registrationCreatedDate',
}

export class Attribute {
  public name: string;
  public type: string;
  public label: object;
  public shortLabel?: object;
  public options?: JSON;
  public questionType?: QuestionType; // TODO: remove this in after implementing pagination
  public fspNames?: FspName[];
  public questionTypes?: QuestionType[];
  public pattern?: string;
}

export enum QuestionType {
  programQuestion = 'programQuestion',
  fspQuestion = 'fspQuestion',
  programCustomAttribute = 'programCustomAttribute',
  monitoringQuestion = 'monitoringQuestion',
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

export type AttributeType = AnswerTypes | CustomAttributeType;
export const AttributeType = { ...AnswerTypes, ...CustomAttributeType };
