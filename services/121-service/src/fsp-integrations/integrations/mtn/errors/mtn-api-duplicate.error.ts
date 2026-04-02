import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';

export class MtnApiDuplicateError extends MtnApiError {
  constructor(message?: string) {
    super(message ?? 'Duplicate transfer request');
    this.name = 'MtnApiDuplicateError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
