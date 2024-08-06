import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';

export interface GetPhysicalCardReturnType {
  readonly status: IntersolveVisaCardStatus;
}
