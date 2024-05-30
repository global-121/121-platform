import { TokenResponseAsset } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/token-response-asset';
import { TokenResponseBalance } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/token-response-balance';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-token-status.enum';

export class IntersolveCreateWalletResponseTokenDto {
  public code: string;
  public blocked?: boolean;
  public type?: string;
  public brandTypeCode?: string;
  public status?: IntersolveVisaTokenStatus;
  public balances?: TokenResponseBalance[];
  public blockReasonCode?: string;
  public tier?: string;
  public holderId?: string;
  public assets?: TokenResponseAsset[];
}
