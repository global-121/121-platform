import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';

export interface ReissueCardParams {
  readonly registrationId: number;
  readonly reference: string;
  readonly name: string;
  readonly contactInformation: ContactInformation;
  readonly brandCode: string;
  readonly coverLetterCode: string;
}
