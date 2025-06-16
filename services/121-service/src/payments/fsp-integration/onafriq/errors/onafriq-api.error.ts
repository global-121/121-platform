// Usage: throw new OnafriqApiError('Error message');
export class OnafriqApiError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'OnafriqApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
