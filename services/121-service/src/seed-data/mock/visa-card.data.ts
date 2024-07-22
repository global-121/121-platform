import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { CustomDataAttributes } from '@121-service/src/registration/enum/custom-data-attributes';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

export const programIdVisa = 3;
export const paymentNrVisa = 1;
export const amountVisa = 25;

export const registrationVisa = {
  referenceId: 'registration-visa-1',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'Jane Doe',
  [CustomDataAttributes.phoneNumber]: '14155238887',
  fspName: FinancialServiceProviderName.intersolveVisa,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  [CustomDataAttributes.whatsappPhoneNumber]: '14155238887',
};
