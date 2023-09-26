import { FspName } from '../../../src/fsp/enum/fsp-name.enum';

export const programId = 3;
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
const expectedValueObject1 = { ...registration1 };
expectedValueObject1['financialServiceProvider'] = expectedValueObject1.fspName;
delete expectedValueObject1.fspName;
expectedValueObject1['registrationProgramId'] = 1;
expectedValueObject1[
  'personAffectedSequence'
] = `PA #${expectedValueObject1['registrationProgramId']}`;

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
const expectedValueObject2 = { ...registration2 };
expectedValueObject2['financialServiceProvider'] = expectedValueObject2.fspName;
delete expectedValueObject2.fspName;
expectedValueObject2['registrationProgramId'] = 2;
expectedValueObject2[
  'personAffectedSequence'
] = `PA #${expectedValueObject2['registrationProgramId']}`;

export const referenceId3 = '43e62864557597e0d';
export const registration3 = {
  referenceId: referenceId3,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 2,
  firstName: 'Sophia',
  lastName: 'Johnson',
  phoneNumber: '14155236666',
  fspName: FspName.intersolveVisa, // Replace with a known FSP name
  whatsappPhoneNumber: '14155236666',
  addressStreet: 'DifferentStreet',
  addressHouseNumber: '3',
  addressHouseNumberAddition: 'B',
  addressPostalCode: '3456CD',
  addressCity: 'DifferentCity',
};
const expectedValueObject3 = { ...registration3 };
expectedValueObject3['financialServiceProvider'] = expectedValueObject3.fspName;
delete expectedValueObject3.fspName;
expectedValueObject3['registrationProgramId'] = 3;
expectedValueObject3[
  'personAffectedSequence'
] = `PA #${expectedValueObject3['registrationProgramId']}`;

export const referenceId4 = '54e62864557597e0d';
export const registration4 = {
  referenceId: referenceId4,
  preferredLanguage: 'nl',
  paymentAmountMultiplier: 3,
  firstName: 'Luis',
  lastName: 'Garcia',
  phoneNumber: '14155235555',
  fspName: FspName.intersolveVisa, // Replace with a known FSP name
  whatsappPhoneNumber: '14155235555',
  addressStreet: 'AnotherStreet',
  addressHouseNumber: '4',
  addressHouseNumberAddition: 'C',
  addressPostalCode: '4567DE',
  addressCity: 'AnotherCity',
};
const expectedValueObject4 = { ...registration4 };
expectedValueObject4['financialServiceProvider'] = expectedValueObject4.fspName;
delete expectedValueObject4.fspName;
expectedValueObject4['registrationProgramId'] = 4;
expectedValueObject4[
  'personAffectedSequence'
] = `PA #${expectedValueObject4['registrationProgramId']}`;

export const expectedAttributes = [
  'id',
  'status',
  'referenceId',
  'phoneNumber',
  'preferredLanguage',
  'inclusionScore',
  'paymentAmountMultiplier',
  'note',
  'noteUpdated',
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
