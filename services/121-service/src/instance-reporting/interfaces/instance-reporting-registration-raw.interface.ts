import { InstanceReportingProgramRaw } from '@121-service/src/instance-reporting/interfaces/instance-reporting-program-raw.interface';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

export interface InstanceReportingRegistrationRaw {
  id: number;
  referenceId: string;
  registrationStatus: RegistrationStatusEnum | null;
  program: InstanceReportingProgramRaw;
}
