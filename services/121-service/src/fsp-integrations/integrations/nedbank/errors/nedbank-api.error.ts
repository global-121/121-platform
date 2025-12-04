import { NedbankApiErrorCode } from '@121-service/src/fsp-integrations/integrations/nedbank/enums/nedbank-api-error-code.enum';

export class NedbankApiError extends Error {
  public code: string | NedbankApiErrorCode | undefined;

  constructor(message?: string, code?: string | NedbankApiErrorCode) {
    super(message);
    this.name = 'NedbankApiError';
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
