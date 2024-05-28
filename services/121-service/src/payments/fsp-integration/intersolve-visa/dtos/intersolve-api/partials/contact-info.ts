import { TypeValue } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/type-value';

export interface ContactInfo {
  readonly addresses: {
    readonly type: string;
    readonly addressLine1: string;
    readonly city: string;
    readonly region?: string;
    readonly postalCode: string;
    readonly country: string;
  }[];
  readonly emailAddresses?: TypeValue[];
  readonly phoneNumbers: TypeValue[];
}
