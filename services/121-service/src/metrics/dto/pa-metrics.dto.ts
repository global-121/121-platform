import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';

export enum PaMetricsProperty {
  totalPaHelped = 'totalPaHelped',
}

export interface PaMetrics {
  [RegistrationStatusEnum.imported]?: number;
  [RegistrationStatusEnum.invited]?: number;
  [RegistrationStatusEnum.noLongerEligible]?: number;
  [RegistrationStatusEnum.startedRegistration]: number;
  [RegistrationStatusEnum.registered]: number;
  [RegistrationStatusEnum.registeredWhileNoLongerEligible]?: number;
  [RegistrationStatusEnum.validated]: number;
  [RegistrationStatusEnum.declined]: number;
  [RegistrationStatusEnum.included]: number;
  [RegistrationStatusEnum.inclusionEnded]: number;
  [RegistrationStatusEnum.rejected]: number;
  [RegistrationStatusEnum.deleted]: number;
  [RegistrationStatusEnum.completed]: number;
  [RegistrationStatusEnum.paused]: number;
  [PaMetricsProperty.totalPaHelped]: number;
}
