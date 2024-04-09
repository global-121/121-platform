import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';

export enum PaMetricsProperty {
  totalPaHelped = 'totalPaHelped',
}

export interface PaMetrics {
  [RegistrationStatusEnum.registered]: number;
  [RegistrationStatusEnum.validated]: number;
  [RegistrationStatusEnum.declined]: number;
  [RegistrationStatusEnum.included]: number;
  [RegistrationStatusEnum.rejected]: number;
  [RegistrationStatusEnum.deleted]: number;
  [RegistrationStatusEnum.completed]: number;
  [RegistrationStatusEnum.paused]: number;
  [PaMetricsProperty.totalPaHelped]: number;
}
