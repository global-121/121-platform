import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

export enum DefaultRegistrationDataAttributeNames {
  phoneNumber = 'phoneNumber',
  whatsappPhoneNumber = 'whatsappPhoneNumber',
  name = 'name',
}

export enum GenericRegistrationAttributes {
  referenceId = 'referenceId',
  phoneNumber = 'phoneNumber',
  preferredLanguage = 'preferredLanguage',
  paymentAmountMultiplier = 'paymentAmountMultiplier',
  projectFspConfigurationName = 'projectFspConfigurationName',
  projectFspConfigurationLabel = 'projectFspConfigurationLabel',
  maxPayments = 'maxPayments',
  paymentCount = 'paymentCount',
  paymentCountRemaining = 'paymentCountRemaining',
  scope = 'scope',
  status = 'status',
  registrationProjectId = 'registrationProjectId',
  inclusionScore = 'inclusionScore',
  created = 'created',
}

export class Attribute {
  public id?: number;
  public name: string;
  public type: RegistrationAttributeTypes;
  public isRequired?: boolean;
  public label: LocalizedString | null;
  public options?: QuestionOption[] | null;
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
