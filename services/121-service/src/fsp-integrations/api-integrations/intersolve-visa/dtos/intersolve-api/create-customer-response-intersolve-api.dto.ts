import { ContactInfoIntersolveApi } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/intersolve-api/partials/contact-info-intersolve-api';
import { ErrorsInResponseIntersolveApi } from '@121-service/src/fsp-integrations/api-integrations/intersolve-visa/dtos/intersolve-api/partials/error-in-response-intersolve-api';

export interface CreateCustomerResponseIntersolveApiDto {
  readonly data: {
    readonly success: boolean;
    readonly errors: ErrorsInResponseIntersolveApi[];
    readonly code: string;
    readonly correlationId: string;
    readonly data: {
      readonly id: string;
      readonly externalReference: string;
      readonly blocked: boolean;
      readonly unblockable: boolean;
      readonly createdAt: string;
      readonly type?: string;
      readonly organization?: {
        readonly name: string;
        readonly registrationNumber: string;
        readonly vatNumber: string;
        readonly registrationCountry: string;
        readonly activityDescription: string;
        readonly website: string;
        readonly extensions: {
          readonly type: string;
          readonly value: string | null;
        }[];
      };
      readonly individual?: {
        readonly firstName: string;
        readonly lastName: string;
        readonly middleName: string;
        readonly initials: string;
      };
      readonly contactInfo?: ContactInfoIntersolveApi;
    };
  };
  readonly status: number;
  readonly statusText: string;
}
