import { FspName } from '../../../src/fsp/enum/fsp-name.enum';

export function createExpectedValueObject(registration, id: number): any {
  const expectedValueObject = { ...registration };
  expectedValueObject['financialServiceProvider'] = expectedValueObject.fspName;
  delete expectedValueObject.fspName;
  expectedValueObject['registrationProgramId'] = id;
  expectedValueObject[
    'personAffectedSequence'
  ] = `PA #${expectedValueObject['registrationProgramId']}`;

  return expectedValueObject;
}

export const programIdPV = 2;
export const programIdOCW = 3;

export const referenceId = '63e62864557597e0d';
export const registrationOCW1 = {
  referenceId: referenceId,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  firstName: 'John',
  lastName: 'Smith',
  phoneNumber: '14155236666',
  fspName: FspName.intersolveJumboPhysical,
  whatsappPhoneNumber: '14155238886',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

const expectedValueObjectOCW1 = createExpectedValueObject(registrationOCW1, 1);

export const referenceIdOCW2 = '22e62864557597e0d';
export const registrationOCW2 = {
  referenceId: referenceIdOCW2,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  firstName: 'Anna',
  lastName: 'Hello',
  phoneNumber: '14155237775',
  fspName: FspName.intersolveVisa,
  whatsappPhoneNumber: '14155237775',
  addressStreet: 'Teststeeg',
  addressHouseNumber: '2',
  addressHouseNumberAddition: '',
  addressPostalCode: '2345AB',
  addressCity: 'AnotherCity',
};

const expectedValueObjectOCW2 = createExpectedValueObject(registrationOCW2, 2);

export const referenceIdOCW3 = '43e62864557597e0d';
export const registrationOCW3 = {
  referenceId: referenceIdOCW3,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 2,
  firstName: 'Sophia',
  lastName: 'Johnson',
  phoneNumber: '14155236666',
  fspName: FspName.intersolveVisa,
  whatsappPhoneNumber: '14155236666',
  addressStreet: 'DifferentStreet',
  addressHouseNumber: '3',
  addressHouseNumberAddition: 'B',
  addressPostalCode: '3456CD',
  addressCity: 'DifferentCity',
};
const expectedValueObjectOCW3 = createExpectedValueObject(registrationOCW3, 3);

export const referenceIdOCW4 = '54e62864557597e0d';
export const registrationOCW4 = {
  referenceId: referenceIdOCW4,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 3,
  firstName: 'Luis',
  lastName: 'Garcia',
  phoneNumber: '14155235555',
  fspName: FspName.intersolveVisa,
  whatsappPhoneNumber: '14155235555',
  addressStreet: 'AnotherStreet',
  addressHouseNumber: '4',
  addressHouseNumberAddition: 'C',
  addressPostalCode: '4567DE',
  addressCity: 'AnotherCity',
};
const expectedValueObjectOCW4 = createExpectedValueObject(registrationOCW4, 4);

export const registrationsOCW = [
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
];

export const referenceIdPV5 = '44e62864557597e0d';
export const registrationPV5 = {
  referenceId: referenceIdPV5,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 1,
  firstName: 'Gemma',
  lastName: 'Houtenbos',
  phoneNumber: '14155235556',
  fspName: FspName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235555',
};

export const referenceIdPV6 = 'asdf234f4gg4ag64545';
export const registration6 = {
  referenceId: referenceIdPV6,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 1,
  firstName: 'Jan',
  lastName: 'Janssen',
  phoneNumber: '14155235551',
  fspName: FspName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235551',
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

export { expectedValueObjectOCW1 as expectedValueObjectOCW1 };
export { expectedValueObjectOCW2 as expectedValueObjectOCW2 };
export { expectedValueObjectOCW3 as expectedValueObjectOCW3 };
export { expectedValueObjectOCW4 as expectedValueObjectOCW4 };
