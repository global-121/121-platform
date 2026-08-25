export class AlfouadApiError extends Error {
  public readonly errorCode: string | undefined;

  constructor({
    message,
    errorCode,
  }: {
    message: string;
    errorCode?: string;
  }) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'AlfouadApiError';
    this.errorCode = errorCode;
  }
}
