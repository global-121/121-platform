import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';

export interface SendUpdatedContactInformationParams {
  readonly registrationId: number;
  readonly contactInformation: ContactInformation;
}
