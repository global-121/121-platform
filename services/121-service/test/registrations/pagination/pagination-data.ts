import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
interface RegistrationWithFspName extends RegistrationEntity {
  programFinancialServiceProviderConfigurationName?: string;
}

export function createExpectedValueObject(
  registration: Partial<RegistrationWithFspName>,
  sequenceNumber: number,
): Partial<RegistrationEntity> {
  const expectedValueObject = {
    ...registration,
    registrationProgramId: sequenceNumber,
    personAffectedSequence: `PA #${sequenceNumber}`,
  };

  return expectedValueObject;
}

export const programIdPV = 2;
export const programIdOCW = 3;
export const programIdWesteros = 2;

export const registrationOCW1 = {
  referenceId: '63e62864557597e0d',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'John Smith',
  phoneNumber: '14155236666',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155238886',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationOCW2 = {
  referenceId: '22e62864557597e0d',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'Anna Hello',
  phoneNumber: '14155237775',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155237775',
  addressStreet: 'Teststeeg',
  addressHouseNumber: '2',
  addressHouseNumberAddition: '',
  addressPostalCode: '2345AB',
  addressCity: 'AnotherCity',
};

export const registrationOCW3 = {
  referenceId: '43e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 2,
  fullName: 'Sophia Johnson',
  phoneNumber: '14155236666',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155236666',
  addressStreet: 'DifferentStreet',
  addressHouseNumber: '3',
  addressHouseNumberAddition: 'B',
  addressPostalCode: '3456CD',
  addressCity: 'DifferentCity',
};

export const registrationOCW4 = {
  referenceId: '54e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Luiz Garcia',
  phoneNumber: '14155235555',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155235555',
  addressStreet: 'AnotherStreet',
  addressHouseNumber: '4',
  addressHouseNumberAddition: 'C',
  addressPostalCode: '4567DE',
  addressCity: 'AnotherCity',
};

export const registrationOCW5 = {
  referenceId: '54e62864557597e034',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Lars Larsson',
  phoneNumber: '14155235556',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235556',
};

export const registrationOCW6Fail = {
  referenceId: '54e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Test mock-fail-create-customer',
  phoneNumber: '14155235555',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155235555',
  addressStreet: 'AnotherStreet',
  addressHouseNumber: '4',
  addressHouseNumberAddition: 'C',
  addressPostalCode: '4567DE',
  addressCity: 'AnotherCity',
};

export const registrationsOCW = [
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
  registrationOCW5,
];

export const registrationPV5 = {
  referenceId: '44e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Gemma Houtenbos',
  phoneNumber: '14155235556',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235555',
};

export const registrationPV6 = {
  referenceId: 'asdf234f4gg4ag64545',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Jan Janssen',
  phoneNumber: '14155235551',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235551',
};

export const registrationPV7 = {
  referenceId: 'asdf234f4gg4ag64547',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Joost Herlembach',
  phoneNumber: '14155235551',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155235551',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPV8 = {
  referenceId: 'asdf234f4gg4ag64567',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'Jack Strong',
  phoneNumber: '14155235557',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155235557',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationsPV = [
  registrationPV5,
  registrationPV6,
  registrationPV7,
  registrationPV8,
];

export const registrationPvScoped = {
  referenceId: '434e62869242497e1e',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Freya Midgard',
  phoneNumber: '14155235554',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235554',
  scope: 'utrecht',
};

export const expectedAttributes = [
  'id',
  'status',
  'referenceId',
  'phoneNumber',
  'preferredLanguage',
  'inclusionScore',
  'paymentAmountMultiplier',
  'financialServiceProviderName',
  'registrationProgramId',
  'personAffectedSequence',
  'name',
  'paymentCount',
];

export const registrationWesteros1 = {
  referenceId: 'westeros123456789',
  preferredLanguage: 'en',
  name: 'John Snow',
  dob: '31-08-1990',
  house: 'stark',
  dragon: 1,
  knowsNothing: true,
  phoneNumber: '14155235554',
  programFinancialServiceProviderConfigurationName: 'ironBank',
  whatsappPhoneNumber: '14155235554',
  motto: 'Winter is coming',
};

export const registrationWesteros2 = {
  referenceId: 'westeros987654321',
  preferredLanguage: 'en',
  name: 'Arya Stark',
  dob: '31-08-1990',
  house: 'stark',
  dragon: 0,
  knowsNothing: false,
  phoneNumber: '14155235555',
  programFinancialServiceProviderConfigurationName: 'ironBank',
  whatsappPhoneNumber: '14155235555',
  motto: 'A girl has no name',
};

export const registrationWesteros3 = {
  referenceId: 'westeros987654322',
  preferredLanguage: 'en',
  name: 'Jaime Lannister',
  dob: '31-08-1990',
  house: 'lannister',
  dragon: 0,
  knowsNothing: false,
  phoneNumber: '14155235556',
  programFinancialServiceProviderConfigurationName: 'gringotts',
  whatsappPhoneNumber: '14155235555',
  motto: 'A lanister always pays his debts',
};

export const registrationCbe = {
  referenceId: 'registration-cbe-1',
  phoneNumber: '14155238886',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.commercialBankEthiopia,
  maxPayments: 3,
  fullName: 'ANDUALEM MOHAMMED YIMER',
  idNumber: '39231855170',
  age: '48',
  gender: 'male',
  bankAccountNumber: '407951684723597',
};

export const registrationSafaricom = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.safaricom,
  phoneNumber: '254708374149',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  maxPayments: 6,
  fullName: 'Barbara Floyd',
  gender: 'male',
  age: 25,
  nationalId: '32121321',
};

export const registrationsSafaricom = [registrationSafaricom];

export const registrationPvExcel1 = {
  referenceId: '44e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Gemma Houtenbos',
  phoneNumber: '14155235551',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.excel,
  whatsappPhoneNumber: '14155235551',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPvExcel2 = {
  referenceId: 'asdf234f4gg4ag64545',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Jan Janssen',
  phoneNumber: '14155235551',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.excel,
  whatsappPhoneNumber: '14155235551',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPvExcel3 = {
  referenceId: 'asdf234f4gg4ag64547',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Joost Herlembach',
  phoneNumber: '14155235551',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.excel,
  whatsappPhoneNumber: '14155235551',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPvExcel4 = {
  referenceId: 'asdf234f4gg4ag64567',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'Jack Strong',
  phoneNumber: '14155235557',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviders.excel,
  whatsappPhoneNumber: '14155235557',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationsPvExcel = [
  registrationPvExcel1,
  registrationPvExcel2,
  registrationPvExcel3,
  registrationPvExcel4,
];
