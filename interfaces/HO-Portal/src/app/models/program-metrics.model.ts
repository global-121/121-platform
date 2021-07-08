export class ProgramMetrics {
  updated: string | Date;
  pa: PeopleMetrics;
}

export class PeopleMetrics {
  startedRegistration: number;
  finishedRegistration: number;
  verified: number;
  included: number;
  inclusionEnded: number;
  rejected: number;
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
