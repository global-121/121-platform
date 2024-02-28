import { AnswerType } from '../../models/fsp.model';

export class CheckAttributeInputUtils {
  static isAttributeCorrectlyFilled(
    type: AnswerType,
    pattern: string,
    value: string,
  ): boolean {
    if (type === AnswerType.Text) {
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
    }
    // not text: correct
    return true;
  }
}
