// TODO: Make properties readonly

import { ErrorsInResponseDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/error-in-response.dto';
import { TokenResponseAsset } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/token-response-asset';
import { TokenResponseBalance } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/internal/intersolve-api/token-response-balance';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-wallet-status.enum';

// TODO: Put this DTO in its own file under /intersolve-api
export class GetTokenResponseDto {
  public data: {
    success: boolean;
    errors?: ErrorsInResponseDto[];
    code?: string;
    correlationId?: string;
    data: {
      code: string;
      blocked?: boolean;
      type?: string;
      brandTypeCode?: string;
      status?: IntersolveVisaTokenStatus;
      balances: TokenResponseBalance[];
      blockReasonCode?: string;
      tier?: string;
      holderId?: string;
      assets?: TokenResponseAsset[];
    };
  };
  public status: number;
  public statusText?: string;
}
