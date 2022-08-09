import { AnswerType } from './q-and-a.models';
import { TranslatableString } from './translatable-string.model';

export class Fsp {
  id: number;
  fsp: string;
  fspDisplayName: TranslatableString | string;
  questions?: FspQuestion[];
}

export class FspQuestion {
  id: number;
  name: string;
  answerType: AnswerType;
  label: TranslatableString;
  placeholder?: TranslatableString;
  options: FspQuestionOption[] | null;
}

export class FspQuestionOption {
  option: string;
  label: TranslatableString;
}
