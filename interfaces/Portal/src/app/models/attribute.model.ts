import { RegistrationAttributeType } from './registration-attribute.model';
import { TranslatableString } from './translatable-string.model';

export class Attribute {
  name: string;
  type: RegistrationAttributeType;
  label: TranslatableString;
  pattern?: string;
}
