import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';

export class NedbankError extends Error {
  public code: NedbankErrorCode | undefined;

  constructor(message?: string, code?: NedbankErrorCode) {
    super(message);
    this.name = 'NedbankError';
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
