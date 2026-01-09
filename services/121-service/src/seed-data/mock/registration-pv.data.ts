import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { DefaultRegistrationDataAttributeNames } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

export const registrationAHWhatsapp = {
  referenceId: '1234abcd5678efgh',
  preferredLanguage: RegistrationPreferredLanguage.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Juan Garcia',
  scope: 'utrecht.houten',
  [DefaultRegistrationDataAttributeNames.phoneNumber]: '14155238888',
  programFspConfigurationName: Fsps.intersolveVoucherWhatsapp,
  [DefaultRegistrationDataAttributeNames.whatsappPhoneNumber]: '14155238888',
  namePartnerOrganization: 'Help Elkaar',
};
