import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';
import { Token } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/token';

export interface GetTokenResponseIntersolveApiDto {
  readonly data: {
    readonly success: boolean;
    readonly errors?: ErrorsInResponse[];
    readonly code?: string;
    readonly correlationId?: string;
    readonly data: Token;
  };
  readonly status: number;
  readonly statusText?: string;
}
