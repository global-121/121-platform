import { FinancialServiceProviderName } from '../../src/financial-service-providers/enum/financial-service-provider-name.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { LanguageEnum } from '../../src/registration/enum/language.enum';

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
