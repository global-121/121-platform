import { OnafriqApiError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq-api.error';

export class DuplicateThirdPartyTransIdError extends OnafriqApiError {
  constructor(message?: string) {
    super(message);
    this.name = 'DuplicateThirdPartyTransIdError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
