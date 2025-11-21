import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

interface RegistrationWithFspName extends RegistrationEntity {
  programFspConfigurationName?: string;
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
export const programIdSafaricom = 1;
export const programIdNedbank = 1;
export const programIdCbe = 1;

export const registrationOCW1 = {
  referenceId: '63e62864557597e0d',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  fullName: 'John Smith',
  phoneNumber: '14155236666',
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: '14155238886',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationOCW2 = {
  referenceId: '22e62864557597e0d',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  fullName: 'Anna Hello',
  phoneNumber: '14155237775',
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: '14155237775',
  addressStreet: 'Teststeeg',
  addressHouseNumber: '2',
  addressHouseNumberAddition: '',
  addressPostalCode: '2345AB',
  addressCity: 'AnotherCity',
};

export const registrationOCW3 = {
  referenceId: '43e62864557597e0d',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 2,
  fullName: 'Sophia Johnson',
  phoneNumber: '14155236666',
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: '14155236666',
  addressStreet: 'DifferentStreet',
  addressHouseNumber: '3',
  addressHouseNumberAddition: 'B',
  addressPostalCode: '3456CD',
  addressCity: 'DifferentCity',
};

export const registrationOCW4 = {
  referenceId: '54e62864557597e0d',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Luiz Garcia',
  phoneNumber: '14155235555',
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: '14155235555',
  addressStreet: 'AnotherStreet',
  addressHouseNumber: '4',
  addressHouseNumberAddition: 'C',
  addressPostalCode: '4567DE',
  addressCity: 'AnotherCity',
};

export const registrationOCW5 = {
  referenceId: '54e62864557597e034',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Lars Larsson',
  phoneNumber: '14155235556',
  programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235556',
};

export const registrationOCW6Fail = {
  referenceId: '54e6286jZ4mhkTtgjM',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Test mock-fail-create-customer',
  phoneNumber: '14155235555',
  programFspConfigurationName: Fsps.intersolveVisa,
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

export const registrationsVisa = [
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
];

export const registrationPV5 = {
  referenceId: '44e62864557597e0d',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Gemma Houtenbos',
  phoneNumber: '14155235556',
  programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235555',
};

export const registrationPV6 = {
  referenceId: 'asdf234f4gg4ag64545',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Jan Janssen',
  phoneNumber: '14155235551',
  programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235551',
};

export const registrationPV7 = {
  referenceId: 'asdf234f4gg4ag64547',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Joost Herlembach',
  phoneNumber: '14155235551',
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: '14155235551',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPV8 = {
  referenceId: 'asdf234f4gg4ag64567',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  fullName: 'Jack Strong',
  phoneNumber: '14155235557',
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: '14155235557',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPvMaxPayment = {
  referenceId: 'asdf234f4gg4ag64569',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  fullName: 'Arkadiusz Zbuczko',
  phoneNumber: '14155235559',
  programFspConfigurationName: Fsps.intersolveVisa,
  whatsappPhoneNumber: '14155235559',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  maxPayments: 1,
};

export const registrationsPV = [
  registrationPV5,
  registrationPV6,
  registrationPV7,
  registrationPV8,
];

export const registrationsVoucher = [registrationPV5, registrationPV6];

export const registrationPvScoped = {
  referenceId: '434e62869242497e1e',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Freya Midgard',
  phoneNumber: '14155235554',
  programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235554',
  scope: 'turkana',
};

export const expectedAttributes = [
  'id',
  'status',
  'referenceId',
  'phoneNumber',
  'preferredLanguage',
  'inclusionScore',
  'paymentAmountMultiplier',
  'fspName',
  'registrationProgramId',
  'personAffectedSequence',
  'name',
  'paymentCount',
];

export const registrationWesteros1 = {
  referenceId: 'westeros123456789',
  preferredLanguage: RegistrationPreferredLanguage.en,
  fullName: 'John Snow',
  dob: '31-08-1990',
  house: 'stark',
  dragon: 1,
  knowsNothing: true,
  phoneNumber: '14155235554',
  programFspConfigurationName: 'ironBank',
  whatsappPhoneNumber: '14155235554',
  motto: 'Winter is coming',
};

export const registrationWesteros2 = {
  referenceId: 'westeros987654321',
  preferredLanguage: RegistrationPreferredLanguage.en,
  fullName: 'Arya Stark',
  dob: '31-08-1990',
  house: 'stark',
  dragon: 0,
  knowsNothing: false,
  phoneNumber: '14155235555',
  programFspConfigurationName: 'ironBank',
  whatsappPhoneNumber: '14155235555',
  motto: 'A girl has no name',
};

export const registrationWesteros3 = {
  referenceId: 'westeros987654322',
  preferredLanguage: RegistrationPreferredLanguage.en,
  fullName: 'Jaime Lannister',
  dob: '31-08-1990',
  house: 'lannister',
  dragon: 0,
  knowsNothing: false,
  phoneNumber: '14155235556',
  programFspConfigurationName: 'gringotts',
  whatsappPhoneNumber: '14155235555',
  motto: 'A lanister always pays his debts',
};

export const registrationWesteros4 = {
  referenceId: 'westeros123456789',
  preferredLanguage: RegistrationPreferredLanguage.en,
  fullName: 'John Snow',
  house: 'stark',
  dragon: 1,
  knowsNothing: true,
  phoneNumber: '14155235554',
  programFspConfigurationName: 'ironBank',
  whatsappPhoneNumber: '14155235554',
  motto: 'Winter is coming',
  fixedChoice: 'no',
  healthArea: 'north',
  openAnswer: 'I know nothing',
  accountId: '123456789',
};

export const registrationCbe = {
  referenceId: 'registration-cbe-1',
  phoneNumber: '14155238886',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  programFspConfigurationName: Fsps.commercialBankEthiopia,
  maxPayments: 3,
  fullName: 'example name for CBE mock mode',
  idNumber: '39231855170',
  age: '48',
  gender: 'male',
  bankAccountNumber: '407951684723597',
};

export const registrationsCbe = [registrationCbe];

export const registrationSafaricom = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  programFspConfigurationName: Fsps.safaricom,
  phoneNumber: '254708374149',
  preferredLanguage: RegistrationPreferredLanguage.en,
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
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Gemma Houtenbos',
  phoneNumber: '14155235551',
  programFspConfigurationName: Fsps.excel,
  whatsappPhoneNumber: '14155235551',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPvExcel2 = {
  referenceId: 'asdf234f4gg4ag64545',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Jan Janssen',
  phoneNumber: '14155235552',
  programFspConfigurationName: Fsps.excel,
  whatsappPhoneNumber: '14155235552',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPvExcel3 = {
  referenceId: 'asdf234f4gg4ag64547',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Joost Herlembach',
  phoneNumber: '14155235553',
  programFspConfigurationName: Fsps.excel,
  whatsappPhoneNumber: '14155235553',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPvExcel4 = {
  referenceId: 'asdf234f4gg4ag64567',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  fullName: 'Jack Strong',
  phoneNumber: '14155235557',
  programFspConfigurationName: Fsps.excel,
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

export const registrationNedbank = {
  referenceId: 'registration-nedbank-1',
  phoneNumber: '27000000000',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  programFspConfigurationName: Fsps.nedbank,
  maxPayments: 3,
  fullName: 'nedbank pa',
};

export const registrationsNedbank = [registrationNedbank];

export const registrationAirtel = {
  referenceId: 'registration-airtel-1',
  phoneNumber: '260978980279',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  programFspConfigurationName: Fsps.airtel,
  maxPayments: 3,
  fullName: 'John Airtel Dimsum',
};

export const registrationCooperativeBankOfOromia = {
  referenceId: 'registration-cooperative-bank-of-oromia-1',
  phoneNumber: '14155238886',
  preferredLanguage: RegistrationPreferredLanguage.en,
  paymentAmountMultiplier: 1,
  programFspConfigurationName: Fsps.cooperativeBankOfOromia,
  maxPayments: 3,
  fullName: 'example name for Cooperative Bank of Oromia mock mode',
  bankAccountNumber: '1022200081754',
};
