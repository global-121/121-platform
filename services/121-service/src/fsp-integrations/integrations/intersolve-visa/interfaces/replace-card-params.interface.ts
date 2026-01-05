import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';

export interface ReplaceCardParams {
  readonly registrationId: number;
  readonly contactInformation: ContactInformation;
  readonly brandCode: string;
  readonly coverLetterCode: string;
  readonly physicalCardToken?: string;
}
