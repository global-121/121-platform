export class AirtelApiError extends Error {
  constructor(message: string) {
    super(message);
    this.message = `Airtel API Error: ${message}`;
    this.name = 'AirtelApiError';
  }
}
