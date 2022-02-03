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
  validationByQr: boolean;
  published: boolean;
  programCustomAttributes: ProgramCustomAttribute[];
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

export class ProgramCustomAttribute {
  label?: TranslatableString;
  name: string;
  type: string;
}
