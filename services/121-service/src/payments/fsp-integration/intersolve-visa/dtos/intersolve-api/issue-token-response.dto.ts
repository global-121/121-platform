import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';
import { TokenAsset } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/token-asset';
import { TokenBalance } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/token-balance';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';

export interface IssueTokenResponseDto {
  readonly data: {
    readonly success: boolean;
    readonly errors?: ErrorsInResponse[];
    readonly code?: string;
    readonly correlationId?: string;
    readonly data: {
      readonly token: {
        readonly code: string;
        readonly blocked?: boolean;
        readonly type?: string;
        readonly brandTypeCode?: string;
        readonly status?: IntersolveVisaTokenStatus;
        readonly balances?: TokenBalance[];
        readonly blockReasonCode?: string;
        readonly tier?: string;
        readonly holderId?: string;
        readonly assets?: TokenAsset[];
      };
    };
  };
  readonly status: number;
  readonly statusText?: string;
}
