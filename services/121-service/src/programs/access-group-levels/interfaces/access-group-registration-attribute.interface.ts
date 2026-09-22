import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export interface AccessGroupRegistrationAttribute {
  readonly id: number;
  readonly name: string;
  readonly type: RegistrationAttributeTypes;
  readonly options: readonly { readonly option: string }[] | null;
}
