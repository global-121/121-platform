import { NedbankErrorCode } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-error-code.enum';

// Usage: throw new NedbankError('Error message');
export class NedbankError extends Error {
  public code: string | NedbankErrorCode | undefined;

  constructor(message?: string, code?: string | NedbankErrorCode) {
    super(message);
    this.name = 'NedbankError';
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
