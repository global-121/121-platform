import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';

export interface TransferResponseIntersolveApiDto {
  readonly status: number;
  readonly statusText?: string;
  readonly data: {
    readonly success: boolean;
    readonly errors: ErrorsInResponseIntersolveApi[];
    readonly code: string;
    readonly correlationId: string;
    readonly data: {
      readonly creditTransactionId: string;
      readonly debitTransactionId: string;
    };
  };
}
