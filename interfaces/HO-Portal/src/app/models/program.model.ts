import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  author: object;
  contactDetails?: string | TranslatableString;
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
  distributionFrequency: DistributionFrequency;
  meetingDocuments?: string | TranslatableString;
  financialServiceProviders?: any[];
  aidworkers?: AidWorker[];
  created: string;
  updated: string;
  state: ProgramPhase;
  validation: boolean;
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
  reviewInclusion = 'reviewInclusion',
  payment = 'payment',
  evaluation = 'evaluation',
}

export class AidWorker {
  email: string;
  created: string | Date;
}
