import {
  CustomDataAttributes,
  FinancialServiceProviderName,
} from './custom-data-attributes.js';

export const registrationVisa = {
  referenceId: 'registration-visa-1',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  firstName: 'Jane',
  lastName: 'Doe',
  [CustomDataAttributes.phoneNumber]: '14155238887',
  fspName: FinancialServiceProviderName.intersolveVisa,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  [CustomDataAttributes.whatsappPhoneNumber]: '14155238887',
};
