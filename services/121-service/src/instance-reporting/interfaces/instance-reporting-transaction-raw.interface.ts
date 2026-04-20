import { InstanceReportingProgramRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-program-raw.interface';

export interface InstanceReportingTransactionRaw {
  id: number;
  status: string;
  transferValue: number | null;
  created: Date;
  updated: Date;
  registration: {
    id: number;
    referenceId: string;
    program: Required<InstanceReportingProgramRaw>;
  };
}
