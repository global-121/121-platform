import { TokenAssetIntersolveApi } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/intersolve-api/partials/token-asset-intersolve-api';
import { TokenBalanceIntersolveApi } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/intersolve-api/partials/token-balance-intersolve-api';
import { IntersolveVisaTokenStatus } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/enums/intersolve-visa-token-status.enum';

export interface TokenIntersolveApi {
  readonly code: string;
  readonly blocked?: boolean;
  readonly type?: string;
  readonly brandTypeCode?: string;
  readonly status?: IntersolveVisaTokenStatus;
  readonly balances?: TokenBalanceIntersolveApi[];
  readonly blockReasonCode?: string;
  readonly tier?: string;
  readonly holderId?: string;
  readonly assets?: TokenAssetIntersolveApi[];
}
