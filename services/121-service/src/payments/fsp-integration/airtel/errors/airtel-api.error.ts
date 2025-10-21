export class AirtelApiError extends Error {
  constructor(message: any) {
    super(message);
    this.message = `Airtel API Error: ${message}`;
    this.name = 'AirtelApiError';
  }
}
