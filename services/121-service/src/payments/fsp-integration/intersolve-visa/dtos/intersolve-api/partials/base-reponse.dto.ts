import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';

export interface BaseResponseDto {
  status: number;
  statusText?: string;
  data?: {
    errors?: ErrorsInResponse[];
  };
}
