import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  titlePortal: string | TranslatableString;
  description: string | TranslatableString;
  created: string;
  updated: string;
  meetingDocuments?: string | TranslatableString;
  ngo: string;
  programQuestions: ProgramQuestion[];
  financialServiceProviders: any[];
  validationByQr: boolean;
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
  phoneNumber = 'tel',
}

export class ProgramAttribute {
  attributeId: number;
  programQuestionName: string;
  programAnswer: string;
}
