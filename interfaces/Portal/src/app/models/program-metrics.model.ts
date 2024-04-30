import RegistrationStatus from '../enums/registration-status.enum';

export class ProgramMetrics {
  updated: string | Date;
  pa?: PeopleMetrics;
}

export class PeopleMetrics {
  [RegistrationStatus.registered]: number;
  [RegistrationStatus.validated]: number;
  [RegistrationStatus.declined]: number;
  [RegistrationStatus.included]: number;
  [RegistrationStatus.inclusionEnded]: number;
  [RegistrationStatus.rejected]: number;
  [RegistrationStatus.deleted]: number;
}

export class MetricRow {
  group?: MetricGroup;
  icon?: string;
  label: string;
  value: number | string;
}

export enum MetricGroup {
  financial = 'financial',
  pa = 'pa',
  programProperties = 'program-properties',
}
