export class RegistrationsInputValidatorHelpers {
  static stringToBoolean(string: string, defaultValue?: boolean): boolean {
    if (typeof string === 'boolean') {
      return string;
    }

    if (string === null) {
      return false;
    }

    if (string === undefined) {
      return this.isValueUndefinedOrNull(defaultValue)
        ? undefined
        : defaultValue;
    }

    switch (string.toLowerCase().trim()) {
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
