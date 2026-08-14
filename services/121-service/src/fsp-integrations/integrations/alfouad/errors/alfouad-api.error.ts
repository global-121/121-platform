export class AlfouadApiError extends Error {
  public readonly errorCode: string | null;

  constructor({
    message,
    errorCode,
  }: {
    message: string;
    errorCode?: string | null;
  }) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AlfouadApiError';
    this.errorCode = errorCode ?? null;
  }
}
