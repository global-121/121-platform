import { ContactInformation } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/interfaces/partials/contact-information.interface';

export interface CreatePhysicalCardParams {
  readonly tokenCode: string;
  readonly name: string;
  readonly contactInformation: ContactInformation;
  readonly coverLetterCode: string;
}
