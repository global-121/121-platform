import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';

export interface TransferResponseDto {
  readonly status: number;
  readonly statusText?: string;
  readonly data: {
    readonly success: boolean;
    readonly errors: ErrorsInResponse[];
    readonly code: string;
    readonly correlationId: string;
    readonly data: {
      readonly creditTransactionId: string;
      readonly debitTransactionId: string;
    };
  };
}
