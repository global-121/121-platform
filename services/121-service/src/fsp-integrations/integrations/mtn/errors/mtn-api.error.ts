export class MtnApiError extends Error {
  constructor(message: string) {
    super(message);
    this.message = `MTN API Error: ${message}`;
    this.name = 'MtnApiError';
  }
}
