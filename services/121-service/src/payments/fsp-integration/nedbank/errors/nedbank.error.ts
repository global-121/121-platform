// Usage: throw new NedbankError('Error message');
// ##TODO: Disucss: I chose not to name it NedbankApiError because it's also used to throw errors in the NedbankService
export class NedbankError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'NedbankError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
