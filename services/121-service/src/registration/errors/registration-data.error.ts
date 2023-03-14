export enum ErrorEnum {
  RegistrationDataError = 'RegistrationDataError',
}

export class RegistrationDataError {
  public constructor(message: string) {
    const error = Error(message);

    // set immutable object properties
    Object.defineProperty(error, 'message', {
      get() {
        return message;
      },
    });
    Object.defineProperty(error, 'name', {
      get() {
        return ErrorEnum.RegistrationDataError;
      },
    });
    // capture where error occured
    Error.captureStackTrace(error, RegistrationDataError);
    return error;
  }
}
