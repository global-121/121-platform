import { IntersolveVisaTokenStatus } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/enums/intersolve-visa-token-status.enum';

export interface GetTokenResult {
  readonly blocked: boolean;
  readonly status: IntersolveVisaTokenStatus;
  readonly balance: number;
}
