import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';

export interface GetPhysicalCardResult {
  readonly status: IntersolveVisaCardStatus;
}
