import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

export const registrationAHWhatsapp = {
  referenceId: '1234abcd5678efgh',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Juan Garcia',
  scope: 'utrecht.houten',
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '14155238888',
  projectFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
  [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]: '14155238888',
  namePartnerOrganization: 'Help Elkaar',
};
