export class CooperativeBankOfOromiaApiError extends Error {
  constructor(message) {
    super(message);
    this.message = `CooperativeBankOfOromia API Error: ${message}`;
    this.name = 'CooperativeBankOfOromiaApiError';
  }
}
