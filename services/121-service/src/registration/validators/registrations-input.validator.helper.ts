export class RegistrationsInputValidatorHelpers {
  static inputToBoolean(
    input: string | null | undefined | number | boolean,
    defaultValue?: boolean,
  ): boolean | undefined {
    if (typeof input === 'boolean') {
      return input;
    }

    if (typeof input === 'number') {
      return input === 1;
    }

    if (input === null) {
      return false;
    }

    if (input === undefined) {
      return this.isValueUndefinedOrNull(defaultValue)
        ? undefined
        : defaultValue;
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
        return this.isValueUndefinedOrNull(defaultValue)
          ? undefined
          : defaultValue;
    }
  }

  static isValueUndefinedOrNull(value: any): boolean {
    return value === undefined || value === null;
  }
}
