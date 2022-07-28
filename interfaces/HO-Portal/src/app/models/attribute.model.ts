import { AnswerType } from './fsp.model';
import { TranslatableString } from './translatable-string.model';

export class Attribute {
  name: string;
  type: AnswerType;
  label: TranslatableString;
  shortLabel: TranslatableString;
}
