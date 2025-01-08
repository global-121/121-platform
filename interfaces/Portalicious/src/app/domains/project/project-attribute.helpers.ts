import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

export const ATTRIBUTE_LABELS: Record<GenericRegistrationAttributes, string> = {
  referenceId: $localize`:@@attribute-label-referenceId:Reference ID`,
  phoneNumber: $localize`:@@attribute-label-phoneNumber:Phone Number`,
  preferredLanguage: $localize`:@@attribute-label-preferredLanguage:Preferred Language`,
  paymentAmountMultiplier: $localize`:@@attribute-label-paymentAmountMultiplier:Transfer value multiplier`,
  programFinancialServiceProviderConfigurationName: $localize`:@@attribute-label-programFinancialServiceProviderConfigurationName:FSP`,
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

export const ATTRIBUTE_EDIT_INFO: Partial<
  Record<GenericRegistrationAttributes, string>
> = {
  maxPayments: $localize`:@@attribute-edit-info-maxPayments:The maximum number of payments for this Person Affected. You can remove the limit by removing the value and saving.`,
  paymentCountRemaining: $localize`:@@attribute-edit-info-paymentCountRemaining:This is automatically calculated based on Max. payments and payments sucessfully sent`,
  paymentAmountMultiplier: $localize`:@@attribute-edit-info-paymentAmountMultiplier:The transfer value will be multiplied by this number for this Person Affected`,
  phoneNumber: $localize`:@@attribute-edit-info-phoneNumber:The required format is: ONLY numbers, including country-code.`,
  scope: $localize`:@@attribute-edit-info-scope:Separate the parts with a dot (i.e. 'amsterdam.west').`,
};

export const isGenericAttribute = (
  name: string,
): name is GenericRegistrationAttributes => name in ATTRIBUTE_LABELS;
