import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

// TODO: This could be refactored to for example only contain the attribute names used by fsps
export enum DefaultRegistrationDataAttributeNames {
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

export enum GenericRegistrationAttributes {
  referenceId = 'referenceId',
  phoneNumber = 'phoneNumber',
  preferredLanguage = 'preferredLanguage',
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  programFinancialServiceProviderConfigurationName = 'programFinancialServiceProviderConfigurationName',
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
  public type: string;
  public isRequired?: boolean;
  public label: LocalizedString | null;
  public options?: QuestionOption[] | null;
  public fspNames?: FinancialServiceProviderName[];
  public pattern?: string | null;
}

export type AttributeWithOptionalLabel = Omit<Attribute, 'label'> &
  Partial<Pick<Attribute, 'label'>>;

export enum RegistrationAttributeTypes {
  tel = 'tel',
  dropdown = 'dropdown',
  numeric = 'numeric',
  numericNullable = 'numeric-nullable',
  text = 'text',
  date = 'date',
  multiSelect = 'multi-select',
  boolean = 'boolean',
}
