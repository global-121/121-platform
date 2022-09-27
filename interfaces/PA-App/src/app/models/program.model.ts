import { Fsp } from './fsp.model';
import { AnswerType } from './q-and-a.models';
import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  titlePaApp: string | TranslatableString;
  description: string | TranslatableString;
  contactDetails?: string | TranslatableString;
  created: string;
  updated: string;
  meetingDocuments?: string | TranslatableString;
  ngo: string;
  programQuestions: ProgramQuestion[];
  financialServiceProviders: Fsp[];
  credDefId: string;
  validation: boolean;
  validationByQr: boolean;
  phoneNumberPlaceholder: string;
}

export class ProgramQuestion {
  id: number;
  name: string;
  answerType: AnswerType;
  label: TranslatableString;
  placeholder?: TranslatableString;
  pattern?: string; // Remember to escape the special characters in the string!
  options: null | ProgramQuestionOption[];
}

export class ProgramQuestionOption {
  option: string;
  label: TranslatableString;
}

export class ProgramAttribute {
  programQuestionName: string;
  programAnswer: string | string[];
}
