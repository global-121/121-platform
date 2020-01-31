import { Fsp } from './fsp.model';
import { AnswerType } from './q-and-a.models';
import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  title: string;
  description: string;
  countryId: number;
  created: string;
  updated: string;
  meetingDocuments: any;
  ngo: string;
  customCriteria: ProgramCriterium[];
  financialServiceProviders: Fsp[];
  credDefId: string;
}

export class ProgramCriterium {
  id: number;
  criterium: string;
  answerType: AnswerType;
  label: TranslatableString;
  options: null | ProgramCriteriumOption[];
}

export class ProgramCriteriumOption {
  option: string;
  label: TranslatableString;
}

export class ProgramAttribute {
  attributeId: number;
  attribute: string;
  answer: string;
}
