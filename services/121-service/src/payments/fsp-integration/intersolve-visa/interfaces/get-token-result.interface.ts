import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';

export interface GetTokenResult {
  readonly blocked: boolean;
  readonly status: IntersolveVisaTokenStatus;
  readonly balance: number;
}
