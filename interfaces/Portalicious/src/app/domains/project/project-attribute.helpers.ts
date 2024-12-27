import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { DataListItem } from '~/components/data-list/data-list.component';
import { LANGUAGE_ENUM_LABEL } from '~/domains/registration/registration.helper';
import { PersonalInformationAttribute } from '~/pages/project-registration-personal-information/project-registration-personal-information.page';

export const ATTRIBUTE_LABELS: Record<GenericRegistrationAttributes, string> = {
  referenceId: $localize`:@@attribute-label-referenceId:Reference ID`,
  phoneNumber: $localize`:@@attribute-label-phoneNumber:Phone Number`,
  preferredLanguage: $localize`:@@attribute-label-preferredLanguage:Preferred Language`,
  paymentAmountMultiplier: $localize`:@@attribute-label-paymentAmountMultiplier:Transfer value multiplier`,
  programFinancialServiceProviderConfigurationName: $localize`:@@attribute-label-programFinancialServiceProviderConfigurationName:FSP Configuration Name`,
  programFinancialServiceProviderConfigurationLabel: $localize`:@@attribute-label-programFinancialServiceProviderConfigurationLabel:FSP`,
  maxPayments: $localize`:@@attribute-label-maxPayments:Max. payments`,
  paymentCount: $localize`:@@attribute-label-paymentCount:Payment Count`,
  paymentCountRemaining: $localize`:@@attribute-label-paymentCountRemaining:Remaining payments`,
  scope: $localize`:@@attribute-label-scope:Scope`,
  status: $localize`:@@attribute-label-status:Status`,
  registrationProgramId: $localize`:@@attribute-label-registrationProgramId:Registration ID`,
  registrationCreatedDate: $localize`:@@attribute-label-registrationCreatedDate:Registration Created Date`,
  inclusionScore: $localize`:@@attribute-label-inclusionScore:Inclusion Score`,
};

export const getGenericAttributeType = (
  attributeName: GenericRegistrationAttributes,
): RegistrationAttributeTypes => {
  switch (attributeName) {
    case GenericRegistrationAttributes.paymentAmountMultiplier:
    case GenericRegistrationAttributes.maxPayments:
    case GenericRegistrationAttributes.paymentCountRemaining:
    case GenericRegistrationAttributes.inclusionScore:
    case GenericRegistrationAttributes.paymentCount:
      return RegistrationAttributeTypes.numeric;
    case GenericRegistrationAttributes.preferredLanguage:
    case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationLabel:
    case GenericRegistrationAttributes.referenceId:
    case GenericRegistrationAttributes.phoneNumber:
    case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName:
    case GenericRegistrationAttributes.scope:
    case GenericRegistrationAttributes.status:
    case GenericRegistrationAttributes.registrationProgramId:
      return RegistrationAttributeTypes.text;
    case GenericRegistrationAttributes.registrationCreatedDate:
      return RegistrationAttributeTypes.date;
  }
};

export const getValueForGenericAttribute = (
  value: unknown,
  attributeName: GenericRegistrationAttributes,
): unknown => {
  switch (attributeName) {
    case GenericRegistrationAttributes.preferredLanguage:
      return LANGUAGE_ENUM_LABEL[value as LanguageEnum];
    default:
      return value;
  }
};

export const personalInformationAttributeToDataListItem = ({
  type,
  value,
  ...attribute
}: PersonalInformationAttribute): DataListItem => {
  switch (type) {
    case RegistrationAttributeTypes.multiSelect:
      throw new Error('multiSelect not supported');
    case RegistrationAttributeTypes.numeric:
      return {
        ...attribute,
        type: 'number',
        value: value as number,
      };
    case RegistrationAttributeTypes.numericNullable:
      return {
        ...attribute,
        type: 'number',
        value: value as null | number,
      };
    case RegistrationAttributeTypes.date:
      return {
        ...attribute,
        type: 'date',
        value: value as Date,
      };
    case RegistrationAttributeTypes.boolean:
      return {
        ...attribute,
        type: 'boolean',
        value: value as boolean,
      };
    case RegistrationAttributeTypes.dropdown:
    case RegistrationAttributeTypes.tel:
    case RegistrationAttributeTypes.text:
      return {
        ...attribute,
        type: 'text',
        value: value as LocalizedString | string,
      };
  }
};

export const isGenericAttribute = (
  name: string,
): name is GenericRegistrationAttributes => name in ATTRIBUTE_LABELS;
