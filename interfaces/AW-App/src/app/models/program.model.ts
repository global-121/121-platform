import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  title: string | TranslatableString;
  description: string | TranslatableString;
  created: string;
  updated: string;
  meetingDocuments?: string | TranslatableString;
  ngo: string;
  customCriteria: ProgramCriterium[];
  financialServiceProviders: any[];
}

export class ProgramCriterium {
  id: number;
  criterium: string;
  answerType: AnswerType;
  label: TranslatableString;
  placeholder?: TranslatableString;
  options: null | ProgramCriteriumOption[];
}

export class ProgramCriteriumOption {
  option: string;
  label: TranslatableString;
}

export enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
  phoneNumber = 'tel',
}

export class ProgramAttribute {
  attributeId: number;
  attribute: string;
  answer: string;
}
