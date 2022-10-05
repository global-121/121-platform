import { AnswerTypes } from '../../registration/enum/custom-data-attributes';
import { CustomAttributeType } from './create-program-custom-attribute.dto';

export class ValidationInfo {
  public readonly type?: AnswerTypes | CustomAttributeType;
  public readonly options?: any[];
}
