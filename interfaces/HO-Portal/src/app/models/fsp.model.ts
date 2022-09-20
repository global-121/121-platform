import { Attribute } from './attribute.model';
import { ProgramPhase } from './program.model';
import { TranslatableString } from './translatable-string.model';
export class Fsp {
  id: number;
  fsp: string;
  fspDisplayName: TranslatableString | string;
  integrationType: FspIntegrationType;
  questions?: FspQuestion[];
  editableAttributes?: Attribute[];
}

export enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
  phoneNumber = 'tel',
  email = 'email',
  boolean = 'boolean',
  string = 'string',
  MultiSelect = 'multi-select',
}
export class FspQuestion {
  id: number;
  name: string;
  answerType: AnswerType;
  label: TranslatableString;
  shortLabel: TranslatableString;
  placeholder?: TranslatableString;
  options: FspAttributeOption[] | null;
  duplicateCheck: boolean;
  phases: ProgramPhase[];
}

export class FspAttributeOption {
  option: string;
  label: TranslatableString;
}

export enum FspIntegrationType {
  api = 'api',
  csv = 'csv',
  xml = 'xml',
}
