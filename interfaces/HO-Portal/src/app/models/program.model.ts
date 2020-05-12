import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  author: object;
  countryId: number;
  startDate: string;
  endDate?: string;
  title: string | TranslatableString;
  description: string | TranslatableString;
  descHumanitarianObjective?: string | TranslatableString;
  location: string | TranslatableString;
  descLocation?: string | TranslatableString;
  descCashType?: string | TranslatableString;
  currency: string;
  fixedTransferValue: number;
  inclusionCalculationType: InclusionCalculationType;
  highestScoresX?: number;
  minimumScore?: number;
  distributionDuration: number;
  distributionFrequency: string;
  meetingDocuments?: string | TranslatableString;
  financialServiceProviders?: any[];
  aidworkers?: any[];
  created: string;
  updated: string;
  state: ProgramPhase;
}

export enum InclusionCalculationType {
  highestScoresX = 'highestScoresX',
  minimumScore = 'minimumScore',
}

export enum ProgramPhase {
  design = 'design',
  registrationValidation = 'registrationValidation',
  inclusion = 'inclusion',
  reviewInclusion = 'reviewInclusion',
  payment = 'payment',
  evaluation = 'evaluation',
}

export enum BulkAction {
  chooseAction = 'choose-action',
  selectForValidation = 'select-for-validation',
}
