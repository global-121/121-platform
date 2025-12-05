import { TypeValueIntersolveApi } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/dtos/intersolve-api/partials/type-value-intersolve-api';

export interface ContactInfoIntersolveApi {
  readonly addresses: {
    readonly type: string;
    readonly addressLine1: string;
    readonly city: string;
    readonly region?: string;
    readonly postalCode: string;
    readonly country: string;
  }[];
  readonly emailAddresses?: TypeValueIntersolveApi[];
  readonly phoneNumbers: TypeValueIntersolveApi[];
}
