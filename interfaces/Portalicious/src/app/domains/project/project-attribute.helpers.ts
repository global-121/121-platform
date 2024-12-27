import {
  GenericRegistrationAttributes,
  RegistrationAttributeTypes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

import { Project } from '~/domains/project/project.model';
import { LANGUAGE_ENUM_LABEL } from '~/domains/registration/registration.helper';

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
    case GenericRegistrationAttributes.maxPayments:
      return RegistrationAttributeTypes.numericNullable;
    case GenericRegistrationAttributes.paymentAmountMultiplier:
    case GenericRegistrationAttributes.paymentCountRemaining:
    case GenericRegistrationAttributes.inclusionScore:
    case GenericRegistrationAttributes.paymentCount:
      return RegistrationAttributeTypes.numeric;
    case GenericRegistrationAttributes.preferredLanguage:
    case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName:
      return RegistrationAttributeTypes.dropdown;
    case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationLabel:
    case GenericRegistrationAttributes.referenceId:
    case GenericRegistrationAttributes.phoneNumber:
    case GenericRegistrationAttributes.scope:
    case GenericRegistrationAttributes.status:
    case GenericRegistrationAttributes.registrationProgramId:
      return RegistrationAttributeTypes.text;
    case GenericRegistrationAttributes.registrationCreatedDate:
      return RegistrationAttributeTypes.date;
  }
};

export const getGenericAttributeOptions = (
  attributeName: GenericRegistrationAttributes,
  project?: Project,
): { value: string; label: LocalizedString | string }[] | undefined => {
  switch (attributeName) {
    case GenericRegistrationAttributes.preferredLanguage:
      return project?.languages.map((language) => ({
        value: language,
        label: LANGUAGE_ENUM_LABEL[language],
      }));
    case GenericRegistrationAttributes.programFinancialServiceProviderConfigurationName:
      return project?.programFinancialServiceProviderConfigurations.map(
        (fsp) => ({
          value: fsp.financialServiceProviderName,
          label: fsp.label,
        }),
      );
    default:
      return undefined;
  }
};

export const isGenericAttribute = (
  name: string,
): name is GenericRegistrationAttributes => name in ATTRIBUTE_LABELS;
