import { FspName } from '../../src/fsp/enum/fsp-name.enum';

export const programIdVisa = 3;
export const paymentNrVisa = 1;
export const amountVisa = 22;

export const referenceIdVisa = '2982g82bdsf89sdsd';
export const registrationVisa = {
  referenceId: referenceIdVisa,
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  firstName: 'Jane',
  lastName: 'Doe',
  phoneNumber: '14155238887',
  fspName: FspName.intersolveVisa,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  whatsappPhoneNumber: '',
};
