import { AnswerType } from '../../models/fsp.model';

export class CheckAttributeInputUtils {
  static isAttributeWronglyFilled(
    type: AnswerType,
    pattern: string,
    value: string,
  ): boolean {
    console.log(
      'type: ',
      type,
      pattern,
      value,
      new RegExp(pattern).test(value || ''),
    );
    if (type === AnswerType.Text) {
      if (pattern) {
        if (new RegExp(pattern).test(value || '')) {
          // text with pattern, and matched: correct
          return false;
        }
        // text with pattern, but not matched: wrong
        return true;
      }
      // text without pattern: correct
      return false;
    } else {
      if (value) {
        // not text + not empty: correct
        return false;
      }
      // not text + empty: wrong
      return true;
    }
  }
}
