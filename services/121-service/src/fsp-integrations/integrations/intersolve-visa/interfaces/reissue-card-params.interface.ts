import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';

export interface ReissueCardParams {
  readonly registrationId: number;
  readonly reference: string;
  readonly contactInformation: ContactInformation;
  readonly brandCode: string;
  readonly coverLetterCode: string;
  readonly physicalCardToken?: string;
}
