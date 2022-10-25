import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  titlePortal: string | TranslatableString;
  titlePaApp: string | TranslatableString;
  description: string | TranslatableString;
  created: string;
  updated: string;
  meetingDocuments?: string | TranslatableString;
  ngo: string;
  programQuestions: ProgramQuestion[];
  financialServiceProviders: any[];
  fullnameNamingConvention: string[];
}

export class ProgramQuestion {
  id: number;
  name: string;
  answerType: AnswerType;
  label: TranslatableString;
  placeholder?: TranslatableString;
  options: null | ProgramQuestionOption[];
}

export class ProgramQuestionOption {
  option: string;
  label: TranslatableString;
}

export enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
  PhoneNumber = 'tel',
  MultiSelect = 'multi-select',
}

export class ProgramAttribute {
  attributeId: number;
  programQuestionName: string;
  programAnswer: string | string[];
}

export class ProgramsDTO {
  programs: Program[];
  programsCount: number;
}
