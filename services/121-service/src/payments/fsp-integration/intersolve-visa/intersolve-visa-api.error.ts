// Usage: throw new IntersolveVisaTransferError('Error message');
export class IntersolveVisaApiError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'IntersolveVisaTransferError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
