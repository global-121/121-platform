import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

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

export const isGenericAttribute = (
  name: string,
): name is GenericRegistrationAttributes => name in ATTRIBUTE_LABELS;
