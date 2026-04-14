export class MtnApiError extends Error {
  constructor(message: string) {
    super(`MTN API Error: ${message}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'MtnApiError';
  }
}
