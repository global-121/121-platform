import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';

export interface BaseResponseIntersolveApiDto {
  status: number;
  statusText?: string;
  data?: {
    errors?: ErrorsInResponseIntersolveApi[];
  };
}
