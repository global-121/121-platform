import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-wallet-status.enum';

export class GetTokenResultDto {
  public readonly blocked: boolean;
  public readonly status: IntersolveVisaTokenStatus;
  public readonly balance: number;
}
