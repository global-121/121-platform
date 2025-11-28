import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';

export interface DebitCardsContactInfo {
  readonly name: string;
  readonly contactInformation: ContactInformation;
}
