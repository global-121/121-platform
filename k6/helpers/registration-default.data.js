import {
  CustomDataAttributes,
  FinancialServiceProviders,
} from './custom-data-attributes.js';

export const registrationVisa = {
  referenceId: 'registration-visa-1',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  fullName: 'Jane Doe',
  [CustomDataAttributes.phoneNumber]: '14155238887',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  [CustomDataAttributes.whatsappPhoneNumber]: '14155238887',
};

export const registrationPV = {
  referenceId: '44e62864557597e0d',
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 1,
  fullName: 'Gemma Houtenbos',
  phoneNumber: '14155235556',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235555',
};

export const registrationSafaricom = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.safaricom,
  phoneNumber: '254708374149',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  maxPayments: 6,
  fullName: 'Barbara Floyd',
  gender: 'male',
  age: 25,
  nationalId: '32121321',
  nameAlternate: 'test',
};

export const registrationNedbank = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.nedbank,
  phoneNumber: '2708374149',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  maxPayments: 6,
  fullName: 'Franklin Floyd',
};
