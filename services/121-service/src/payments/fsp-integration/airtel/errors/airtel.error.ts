export class AirtelError extends Error {
  constructor(message) {
    super(message);
    this.message = `Airtel Error: ${message}`;
    this.name = 'AirtelError';
  }
}
