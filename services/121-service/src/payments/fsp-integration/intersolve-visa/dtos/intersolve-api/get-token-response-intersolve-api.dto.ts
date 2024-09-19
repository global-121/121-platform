import { ErrorsInResponseIntersolveApi } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';
import { TokenIntersolveApi } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/token-intersolve-api';

export interface GetTokenResponseIntersolveApiDto {
  readonly data: {
    readonly success: boolean;
    readonly errors?: ErrorsInResponseIntersolveApi[];
    readonly code?: string;
    readonly correlationId?: string;
    readonly data: TokenIntersolveApi;
  };
  readonly status: number;
  readonly statusText?: string;
}
