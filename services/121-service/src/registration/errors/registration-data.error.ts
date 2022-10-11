export class RegistrationDataSaveError {
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
        return 'RegistrationDataSaveError';
      },
    });
    // capture where error occured
    Error.captureStackTrace(error, RegistrationDataSaveError);
    return error;
  }
}
