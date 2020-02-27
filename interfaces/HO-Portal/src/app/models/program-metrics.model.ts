export class ProgramMetrics {
  updated: string | Date;
  pa: PeopleMetrics;
  funding: FundsMetrics;
}

export class PeopleMetrics {
  pendingVerification: number;
  verifiedAwaitingDecision: number;
  included: number;
  excluded: number;
}

export class FundsMetrics {
  totalRaised: number;
  totalTransferred: number;
  totalAvailable: number;
}

export class MetricRow {
  group?: MetricGroup;
  icon?: string;
  label: string;
  value: number | string;
}

export enum MetricGroup {
  pa = 'pa',
  funds = 'funds',
}
