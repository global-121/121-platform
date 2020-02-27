import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  title: string | TranslatableString;
  description: string | TranslatableString;
  countryId: number;
  currency: string;
  fixedTransferValue: number;
  created: string;
  updated: string;
  author: object;
  inclusionCalculationType: InclusionCalculationType;
  highestScoresX: number;
  minimumScore: number;
  distributionDuration: number;
  distributionFrequency: string;
  startDate: string;
  state: ProgramPhase;
}

export enum InclusionCalculationType {
  highestScoresX = 'highestScoresX',
  minimumScore = 'minimumScore',
}

export enum ProgramPhase {
  design = 'design',
  registration = 'registration',
  inclusion = 'inclusion',
  finalize = 'finalize',
  payment = 'payment',
  evaluation = 'evaluation',
}
