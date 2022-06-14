import { ProgramPhase } from './program.model';
import { TranslatableString } from './translatable-string.model';

export class Fsp {
  id: number;
  fsp: string;
  fspDisplayName: TranslatableString | string;
  integrationType: FspIntegrationType;
  attributes?: FspAttribute[];
}

export enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
  phoneNumber = 'tel',
  email = 'email',
}
export class FspAttribute {
  id: number;
  name: string;
  answerType: AnswerType;
  label: TranslatableString;
  placeholder?: TranslatableString;
  options: FspAttributeOption[] | null;
  phases: ProgramPhase[];
}

export class FspAttributeOption {
  option: string;
  label: TranslatableString;
}

export enum FspIntegrationType {
  api = 'api',
  csv = 'csv',
}
