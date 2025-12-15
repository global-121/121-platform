import { HttpStatus } from "@nestjs/common";

// Usage: throw new IntersolveVisaApiError('Error message');
export class IntersolveVisaApiError extends Error {
  public statusCode?: HttpStatus;

  constructor(message?: string, statusCode?: HttpStatus) {
    super(message);
    this.name = 'IntersolveVisaApiError';
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
  }
}
