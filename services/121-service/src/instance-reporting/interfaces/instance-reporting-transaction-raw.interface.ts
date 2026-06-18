import { InstanceReportingProgramRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-program-raw.interface';

export interface InstanceReportingTransactionRaw {
  id: number;
  status: string;
  transferValue: number | null;
  created: Date;
  updated: Date;
  // The 'Transaction started' event(s). Used to report when processing of the
  // transaction started (i.e. after approval). At most one is expected.
  // If you started a transaction again a retry events is saved instead
  transactionEvents?: { id: number; created: Date }[];
  registration: {
    id: number;
    referenceId: string;
    program: Required<InstanceReportingProgramRaw>;
  };
}
