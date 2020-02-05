export class Program {
  id: number;
  title: string;
  description: string;
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
  state: string;
}

export enum InclusionCalculationType {
  highestScoresX = 'highestScoresX',
  minimumScore = 'minimumScore',
}
