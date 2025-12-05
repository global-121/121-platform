import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';
import { TokenIntersolveApi } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/partials/token-intersolve-api';

export interface IssueTokenResponseIntersolveApiDto {
  readonly data: {
    readonly success: boolean;
    readonly errors?: ErrorsInResponseIntersolveApi[];
    readonly code?: string;
    readonly correlationId?: string;
    readonly data: {
      readonly token: TokenIntersolveApi;
    };
  };
  readonly status: number;
  readonly statusText?: string;
}
