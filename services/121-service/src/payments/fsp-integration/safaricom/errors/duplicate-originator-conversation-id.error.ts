import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';

export class DuplicateOriginatorConversationIdError extends SafaricomApiError {
  constructor(message?: string) {
    super(message);
    this.name = 'DuplicateOriginatorConversationIdError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
