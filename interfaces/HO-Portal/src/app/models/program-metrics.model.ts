export class ProgramMetrics {
  updated: string | Date;
  pa: PeopleMetrics;
  funding: FundsMetrics;
}

export class PeopleMetrics {
  startedEnlisting: number;
  finishedEnlisting: number;
  verified: number;
  included: number;
  excluded: number;
}

export class FundsMetrics {
  totalAvailable: number;
}

export class MetricRow {
  group?: MetricGroup;
  icon?: string;
  label: string;
  value: number | string;
}

export enum MetricGroup {
  aidworkers = 'aidworkers',
  financial = 'financial',
  pa = 'pa',
  programProperties = 'program-properties',
}
