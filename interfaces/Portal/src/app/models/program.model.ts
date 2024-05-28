import { FilterOperator } from '../enums/filters.enum';
import { Attribute } from './attribute.model';
import { Fsp } from './fsp.model';
import { LanguageEnum } from './person.model';
import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  author: object;
  startDate: string;
  endDate?: string;
  titlePortal: string | TranslatableString;
  description: string | TranslatableString;
  location: string | TranslatableString;
  currency: string;
  fixedTransferValue: number;
  paymentAmountMultiplierFormula?: string;
  targetNrRegistrations?: number;
  distributionDuration: number;
  distributionFrequency: DistributionFrequency;
  financialServiceProviders?: Fsp[];
  aidworkerAssignments?: any[];
  created: string;
  updated: string;
  validation: boolean;
  published: boolean;
  programCustomAttributes: ProgramCustomAttribute[];
  programQuestions: ProgramQuestion[];
  editableAttributes?: Attribute[];
  notifications: string | TranslatableString;
  languages: LanguageEnum[];
  enableMaxPayments: boolean;
  enableScope: boolean;
  fullnameNamingConvention: string[];
  paTableAttributes: Attribute[];
  filterableAttributes: FilterableAttributeGroup[];
  allowEmptyPhoneNumber: boolean;
  monitoringDashboardUrl?: string;
  budget?: number;
}

class FilterableAttributeGroup {
  group: string;
  filters: FilterableAttributeDefinition[];
}

class FilterableAttributeDefinition {
  name: string;
  allowedOperators: FilterOperator[];
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

export enum ProgramTab {
  overview = 'overview',
  team = 'team',
  peopleAffected = 'people-affected',
  payment = 'payment',
  monitoring = 'dashboard',
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
}

export class PaTableAttribute extends Attribute {}

export class ProgramQuestion {
  id: number;
  name: string;
  answerType: string;
  label: TranslatableString;
  placeholder?: TranslatableString;
  pattern?: string; // Remember to escape the special characters in the string!
  options: null | ProgramQuestionOption[];
  duplicateCheck: boolean;
}

export class ProgramQuestionOption {
  option: string;
  label: TranslatableString;
}
