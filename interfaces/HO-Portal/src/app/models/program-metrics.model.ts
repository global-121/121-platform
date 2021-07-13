import { PaStatus } from './person.model';

export class ProgramMetrics {
  updated: string | Date;
  pa: PeopleMetrics;
}

export class PeopleMetrics {
  [PaStatus.created]: number;
  [PaStatus.registered]: number;
  [PaStatus.validated]: number;
  [PaStatus.included]: number;
  [PaStatus.inclusionEnded]: number;
  [PaStatus.rejected]: number;
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
