import { ContactInformation } from '@121-service/src/payments/fsp-integration/intersolve-visa/interfaces/partials/contact-information.interface';

export interface SendUpdatedContactInformationParams {
  readonly registrationId: number;
  readonly contactInformation: ContactInformation;
}
