import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';

export enum BlockTokenReasonCodeEnum {
  BLOCK_GENERAL = 'BLOCK_GENERAL',
  UNBLOCK_GENERAL = 'UNBLOCK_GENERAL',
}

export interface BlockTokenReturnType {
  readonly data: {
    readonly success?: boolean;
    readonly errors?: ErrorsInResponse[];
    readonly code?: string;
    readonly correlationId?: string;
  };
  readonly status: number;
  readonly statusText?: string;
}
