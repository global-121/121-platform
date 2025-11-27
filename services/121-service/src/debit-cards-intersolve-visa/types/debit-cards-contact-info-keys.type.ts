import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';

export type DebitCardsContactInfoKeys =
  | keyof ContactInformation
  | FspAttributes.fullName;
