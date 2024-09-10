import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';

// TODO: REFACTOR: The name of this interface does not correspond to the file name and is not according to the naming convention.
export interface IntersolveVisaBaseResponseDto {
  status: number;
  statusText?: string;
  data?: {
    errors?: ErrorsInResponse[];
  };
}
