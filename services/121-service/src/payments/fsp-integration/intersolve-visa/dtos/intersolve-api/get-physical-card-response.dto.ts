import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';
import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-card-status.enum';

export interface GetPhysicalCardResponseDto {
  readonly data: {
    readonly data: {
      readonly cardURL: string;
      readonly cardFrameURL: string;
      readonly accessToken: string;
      readonly status: IntersolveVisaCardStatus;
    };
    readonly success: boolean;
    readonly errors?: ErrorsInResponse[];
    readonly code?: string;
    readonly correlationId: string;
  };
  readonly status: number;
  readonly statusText?: string;
}
