import { IntersolveVisaTokenStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-token-status.enum';

export interface IssueTokenResult {
  readonly code: string;
  readonly blocked: boolean;
  readonly status: IntersolveVisaTokenStatus | undefined;
}
