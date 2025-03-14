export class RegistrationsInputValidatorHelpers {
  static inputToBoolean(
    input: string | null | undefined | number | boolean,
  ): boolean | undefined {
    if (typeof input === 'boolean') {
      return input;
    }

    if (typeof input === 'number') {
      return input === 1;
    }

    if (input === null) {
      return undefined;
    }

    if (input === undefined) {
      return undefined;
    }

    switch (input.toLowerCase().trim()) {
      case 'true':
      case 'yes':
      case '1':
        return true;
      case 'false':
      case 'no':
      case '0':
      case '':
        return false;
      default:
        return false;
    }
  }
}
