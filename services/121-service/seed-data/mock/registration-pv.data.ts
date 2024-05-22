import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

export const registrationAHWhatsapp = {
  referenceId: '1234abcd5678efgh',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Juan Garcia',
  scope: 'utrecht.houten',
  [CustomDataAttributes.phoneNumber]: '14155238888',
  fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
  [CustomDataAttributes.whatsappPhoneNumber]: '14155238888',
  namePartnerOrganization: 'Help Elkaar',
};
