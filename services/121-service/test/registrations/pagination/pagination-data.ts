import { FspName } from '../../../src/fsp/enum/fsp-name.enum';

export function createExpectedValueObject(registration, id: number): any {
  const expectedValueObject = { ...registration };
  expectedValueObject['financialServiceProvider'] = expectedValueObject.fspName;
  delete expectedValueObject.fspName;
  expectedValueObject['registrationProgramId'] = id;
  expectedValueObject['personAffectedSequence'] =
    `PA #${expectedValueObject['registrationProgramId']}`;

  return expectedValueObject;
}

export const programIdOCW = 3;
export const programIdPV = 2;

export const referenceId = '63e62864557597e0d';
export const registration1 = {
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

const expectedValueObject1 = createExpectedValueObject(registration1, 1);

export const referenceId2 = '22e62864557597e0d';
export const registration2 = {
  referenceId: referenceId2,
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

const expectedValueObject2 = createExpectedValueObject(registration2, 2);

export const referenceId3 = '43e62864557597e0d';
export const registration3 = {
  referenceId: referenceId3,
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
const expectedValueObject3 = createExpectedValueObject(registration3, 3);

export const referenceId4 = '54e62864557597e0d';
export const registration4 = {
  referenceId: referenceId4,
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
const expectedValueObject4 = createExpectedValueObject(registration4, 4);

export const referenceId5 = '44e62864557597e0d';
export const registration5 = {
  referenceId: referenceId5,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 1,
  firstName: 'Gemma',
  lastName: 'Houtenbos',
  phoneNumber: '14155235556',
  fspName: FspName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235555',
};

export const referenceId6 = 'asdf234f4gg4ag64545';
export const registration6 = {
  referenceId: referenceId6,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 1,
  firstName: 'Jan',
  lastName: 'Janssen',
  phoneNumber: '14155235551',
  fspName: FspName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235551',
};

export const referenceId1PV = 'bcaf234f4gg4ag64541';
export const registration1PV = {
  referenceId: referenceId1PV,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  nameFirst: 'Yasmin',
  nameLast: 'Abdullah',
  phoneNumber: '14155235559',
  fspName: FspName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235559',
  scope: 'zeeland.goes',
};

export const referenceId2PV = 'bcaf234f4gg4ag64542';
export const registration2PV = {
  referenceId: referenceId2PV,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  nameFirst: 'Jose',
  nameLast: 'Santos',
  phoneNumber: '14155235560',
  fspName: FspName.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235560',
  scope: 'utrecht.houten',
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

export { expectedValueObject1 };
export { expectedValueObject2 };
export { expectedValueObject3 };
export { expectedValueObject4 };
