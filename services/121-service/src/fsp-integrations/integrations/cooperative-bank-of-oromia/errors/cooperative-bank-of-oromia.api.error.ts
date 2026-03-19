export class CooperativeBankOfOromiaApiError extends Error {
  constructor(message: string) {
    super(message);
    this.message = `CooperativeBankOfOromia API Error: ${message}`;
    this.name = 'CooperativeBankOfOromiaApiError';
  }
}
