import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

export const programIdVisa = 3;
export const paymentIdVisa = 1;
export const amountVisa = 25;

export const registrationVisa = {
  referenceId: 'registration-visa-1',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'Jane Doe',
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '14155238887',
  programFspConfigurationName: Fsps.intersolveVisa,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]: '14155238887',
};
