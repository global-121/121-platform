import { Attribute } from './attribute.model';
import { Fsp } from './fsp.model';
import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  author: object;
  contactDetails?: string | TranslatableString;
  startDate: string;
  endDate?: string;
  titlePortal: string | TranslatableString;
  titlePaApp: string | TranslatableString;
  description: string | TranslatableString;
  location: string | TranslatableString;
  descCashType?: string | TranslatableString;
  currency: string;
  fixedTransferValue: number;
  paymentAmountMultiplierFormula?: string;
  inclusionCalculationType: InclusionCalculationType;
  highestScoresX?: number;
  minimumScore?: number;
  distributionDuration: number;
  distributionFrequency: DistributionFrequency;
  meetingDocuments?: string | TranslatableString;
  financialServiceProviders?: Fsp[];
  aidworkerAssignments?: any[];
  created: string;
  updated: string;
  phase: ProgramPhase;
  validation: boolean;
  published: boolean;
  programCustomAttributes: ProgramCustomAttribute[];
  programQuestions: ProgramQuestion[];
  editableAttributes?: Attribute[];
}

export class ProgramStats {
  programId: number;
  targetedPeople: number;
  includedPeople: number;
  totalBudget: number;
  spentMoney: number;
}

export enum InclusionCalculationType {
  highestScoresX = 'highestScoresX',
  minimumScore = 'minimumScore',
}

export enum DistributionFrequency {
  week = 'week',
  month = 'month',
}

export enum ProgramPhase {
  design = 'design',
  registrationValidation = 'registrationValidation',
  inclusion = 'inclusion',
  payment = 'payment',
  evaluation = 'evaluation',
}

export class AidWorker {
  email: string;
  created: string | Date;
}

export class ProgramCustomAttribute {
  id: number;
  programId: number;
  name: string;
  type: string;
  label?: TranslatableString;
  shortLabel?: TranslatableString;
  phases: ProgramPhase[];
}

export class PaTableAttribute extends ProgramCustomAttribute {}

export class ProgramQuestion {
  id: number;
  name: string;
  answerType: string;
  label: TranslatableString;
  shortLabel: TranslatableString;
  placeholder?: TranslatableString;
  pattern?: string; // Remember to escape the special characters in the string!
  options: null | ProgramQuestionOption[];
  duplicateCheck: boolean;
  phases: ProgramPhase[];
}

export class ProgramQuestionOption {
  option: string;
  label: TranslatableString;
}
