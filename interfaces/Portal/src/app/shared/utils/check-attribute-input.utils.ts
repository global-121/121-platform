import { RegistrationAttributeType } from '../../models/registration-attribute.model';

export class CheckAttributeInputUtils {
  static isAttributeCorrectlyFilled(
    type: RegistrationAttributeType,
    pattern: string,
    value: string,
    isRequired: boolean,
  ): boolean {
    if (value == null || value === '') {
      if (isRequired) {
        return false;
      }
      return true;
    }

    if (type === RegistrationAttributeType.Text) {
      if (pattern) {
        if (new RegExp(pattern).test(value || '')) {
          // text with pattern, and matched: correct
          return true;
        }
        // text with pattern, but not matched: wrong
        return false;
      }
      // text without pattern: correct
      return true;
    } else if (type === RegistrationAttributeType.Number) {
      if (value) {
        // number filled: correct
        return true;
      }
      // number empty: false
      return false;
    }
    // not text/number: correct
    return true;
  }
}
