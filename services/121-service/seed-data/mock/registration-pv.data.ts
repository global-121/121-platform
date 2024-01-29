import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { CustomDataAttributes } from '../../src/registration/enum/custom-data-attributes';
import { LanguageEnum } from '../../src/registration/enum/language.enum';

export const registrationAHWhatsapp = {
  referenceId: '1234abcd5678efgh',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  firstName: 'Juan',
  lastName: 'Garcia',
  scope: 'utrecht.houten',
  [CustomDataAttributes.phoneNumber]: '14155238888',
  fspName: FspName.intersolveVoucherWhatsapp,
  [CustomDataAttributes.whatsappPhoneNumber]: '14155238888',
  namePartnerOrganization: 'Help Elkaar',
};
