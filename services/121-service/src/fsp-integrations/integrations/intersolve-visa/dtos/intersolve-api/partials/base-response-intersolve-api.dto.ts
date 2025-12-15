import { HttpStatus } from '@nestjs/common';

import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';

export interface BaseResponseIntersolveApiDto {
  status?: HttpStatus;
  statusText?: string;
  data?: {
    errors?: ErrorsInResponseIntersolveApi[];
  };
}
