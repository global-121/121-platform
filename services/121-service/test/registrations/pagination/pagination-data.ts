import { FinancialServiceProviderName } from '../../../src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationEntity } from '../../../src/registration/registration.entity';
import { LanguageEnum } from '../../../src/shared/enum/language.enums';

export function createExpectedValueObject(
  registration: Partial<RegistrationEntity> | any,
  sequenceNumber: number,
): RegistrationEntity {
  const expectedValueObject = {
    ...registration,
    financialServiceProvider: registration.fspName,
    registrationProgramId: sequenceNumber,
    personAffectedSequence: `PA #${sequenceNumber}`,
  };
  delete expectedValueObject.fspName;

  return expectedValueObject;
}

export const programIdPV = 2;
export const programIdOCW = 3;
export const programIdWesteros = 2;
export const programIdWithValidation = 3;

export const registrationOCW1 = {
  referenceId: '63e62864557597e0d',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  firstName: 'John',
  lastName: 'Smith',
  phoneNumber: '14155236666',
  fspName: FinancialServiceProviderName.intersolveJumboPhysical,
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
  firstName: 'Anna',
  lastName: 'Hello',
  phoneNumber: '14155237775',
  fspName: FinancialServiceProviderName.intersolveVisa,
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
  firstName: 'Sophia',
  lastName: 'Johnson',
  phoneNumber: '14155236666',
  fspName: FinancialServiceProviderName.intersolveVisa,
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
  firstName: 'Luis',
  lastName: 'Garcia',
  phoneNumber: '14155235555',
  fspName: FinancialServiceProviderName.intersolveVisa,
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
];

export const registrationPV5 = {
  referenceId: '44e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  firstName: 'Gemma',
  lastName: 'Houtenbos',
  phoneNumber: '14155235556',
  fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235555',
};

export const registrationPV6 = {
  referenceId: 'asdf234f4gg4ag64545',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  firstName: 'Jan',
  lastName: 'Janssen',
  phoneNumber: '14155235551',
  fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235551',
};

export const registrationPvScoped = {
  referenceId: '434e62869242497e1e',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  firstName: 'Freya',
  lastName: 'Midgard',
  phoneNumber: '14155235554',
  fspName: FinancialServiceProviderName.intersolveVoucherWhatsapp,
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
  'financialServiceProvider',
  'registrationProgramId',
  'personAffectedSequence',
  'name',
  'paymentCount',
];

export const registrationWesteros1 = {
  referenceId: 'westeros123456789',
  preferredLanguage: 'en',
  name: 'John Snow',
  dob: '283-12-31',
  house: 'stark',
  dragon: 1,
  knowsNothing: true,
  phoneNumber: '14155235554',
  fspName: 'Excel',
  whatsappPhoneNumber: '14155235554',
  motto: 'Winter is coming',
};

export const registrationWesteros2 = {
  referenceId: 'westeros987654321',
  preferredLanguage: 'en',
  name: 'Arya Stark',
  dob: '288-12-31',
  house: 'stark',
  dragon: 0,
  knowsNothing: false,
  phoneNumber: '14155235555',
  fspName: 'Excel',
  whatsappPhoneNumber: '14155235555',
  motto: 'A girl has no name',
};
