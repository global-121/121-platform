import { CustomAttributeType } from '@121-service/src/programs/dto/create-program-custom-attribute.dto';
import { AnswerTypes } from '@121-service/src/registration/enum/custom-data-attributes';

export class ValidationInfo {
  public readonly type?: AnswerTypes | CustomAttributeType;
  public readonly options?: any[];
}
