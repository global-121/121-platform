import { ContactInformation } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/interfaces/partials/contact-information.interface';
import { FspAttributes } from '@121-service/src/fsp-management/enums/fsp-attributes.enum';

export type IntersolveVisaContactInfoKeys =
  | keyof ContactInformation
  | FspAttributes.fullName;
