import { FilterOperatorEnum } from '../services/filter.service';
import { Attribute } from './attribute.model';
import { Fsp } from './fsp.model';
import { LanguageEnum } from './person.model';
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
  currency: string;
  fixedTransferValue: number;
  paymentAmountMultiplierFormula?: string;
  targetNrRegistrations?: number;
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
  notifications: string | TranslatableString;
  languages: LanguageEnum[];
  enableMaxPayments: boolean;
  fullnameNamingConvention: string[];
  paTableAttributes: Attribute[];
  filterableAttributes: FilterableAttributeGroup[];
  monitoringDashboardUrl?: string;
  evaluationDashboardUrl?: string;
}

class FilterableAttributeGroup {
  group: string;
  filters: FilterableAttributeDefinition[];
}

class FilterableAttributeDefinition {
  name: string;
  allowedOperators: FilterOperatorEnum[];
  paTableAttributes: PaTableAttribute[];
  isInteger: boolean;
}

export class ProgramStats {
  programId: number;
  targetedPeople: number;
  includedPeople: number;
  totalBudget: number;
  spentMoney: number;
}

export enum DistributionFrequency {
  week = 'week',
  weeks2 = '2-weeks',
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

export class PaTableAttribute extends Attribute {
  phases?: ProgramPhase[];
}

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
