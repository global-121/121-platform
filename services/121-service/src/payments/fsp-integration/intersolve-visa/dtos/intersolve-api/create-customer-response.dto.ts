import { ContactInfo } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/contact-info';
import { ErrorsInResponse } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/error-in-response';

export interface CreateCustomerResponseDto {
  readonly data: {
    readonly success: boolean;
    readonly errors: ErrorsInResponse[];
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
      readonly contactInfo?: ContactInfo;
    };
  };
  readonly status: number;
  readonly statusText: string;
}
