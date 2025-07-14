export class AirtelApiError extends Error {
  constructor(message) {
    super(message);
    this.message = `Airtel API Error: ${message}`;
    this.name = 'AirtelApiError';
  }
}
