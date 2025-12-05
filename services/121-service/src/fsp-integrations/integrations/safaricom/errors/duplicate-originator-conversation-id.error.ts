import { SafaricomApiError } from '@121-service/src/fsp-integrations/integrations/safaricom/errors/safaricom-api.error';

export class DuplicateOriginatorConversationIdError extends SafaricomApiError {
  constructor(message?: string) {
    super(message);
    this.name = 'DuplicateOriginatorConversationIdError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
