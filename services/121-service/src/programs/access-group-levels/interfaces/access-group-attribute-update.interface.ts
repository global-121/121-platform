import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export interface AccessGroupAttributeUpdate {
  readonly type?: RegistrationAttributeTypes;
  readonly options?: { readonly option: string }[];
}
