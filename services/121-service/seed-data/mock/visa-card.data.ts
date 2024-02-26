import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { LanguageEnum } from '../../src/registration/enum/language.enum';

export const programIdVisa = 3;
export const paymentNrVisa = 1;
export const amountVisa = 25;

export const registrationVisa = {
  referenceId: '2982g82bdsf89sdsd',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  firstName: 'Jane',
  lastName: 'Doe',
  [CustomDataAttributes.phoneNumber]: '14155238887',
  fspName: FspName.intersolveVisa,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  [CustomDataAttributes.whatsappPhoneNumber]: '',
};
