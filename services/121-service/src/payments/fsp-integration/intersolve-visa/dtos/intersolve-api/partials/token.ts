import { TokenAsset } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/token-asset';
import { TokenBalance } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/token-balance';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';

export interface Token {
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
}
