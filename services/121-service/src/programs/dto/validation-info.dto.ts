import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export class ValidationInfo {
  public readonly type?: RegistrationAttributeTypes;
  public readonly options?: any[];
}
