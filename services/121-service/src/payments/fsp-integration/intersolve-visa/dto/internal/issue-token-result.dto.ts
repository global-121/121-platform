import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-wallet-status.enum';

export class IssueTokenResultDto {
  public readonly code: string;
  public readonly blocked: boolean;
  public readonly status: IntersolveVisaTokenStatus | undefined;
}
