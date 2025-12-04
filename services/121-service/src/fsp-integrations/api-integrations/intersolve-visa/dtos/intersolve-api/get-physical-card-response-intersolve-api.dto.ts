import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';
import { IntersolveVisaCardStatus } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/enums/intersolve-visa-card-status.enum';

export interface GetPhysicalCardResponseIntersolveApiDto {
  readonly data: {
    readonly data: {
      readonly cardURL: string;
      readonly cardFrameURL: string;
      readonly accessToken: string;
      readonly status: IntersolveVisaCardStatus;
    };
    readonly success: boolean;
    readonly errors?: ErrorsInResponseIntersolveApi[];
    readonly code?: string;
    readonly correlationId: string;
  };
  readonly status: number;
  readonly statusText?: string;
}
