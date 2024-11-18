// Usage: throw new SafaricomApiError('Error message');
export class SafaricomApiError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'SafaricomApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
