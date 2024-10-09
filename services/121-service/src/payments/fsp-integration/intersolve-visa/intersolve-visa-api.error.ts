// Usage: throw new IntersolveVisaApiError('Error message');
export class IntersolveVisaApiError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'IntersolveVisaApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
