import {
  AggregatePerMonth,
  AggregatePerPayment,
} from '@121-service/src/metrics/dto/payment-aggregate.dto';
import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { RegistrationCountByDate } from '@121-service/src/metrics/dto/registration-count-by-date.dto';
import { RegistrationStatusStats } from '@121-service/src/metrics/dto/registrationstatus-stats.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { Dto } from '~/utils/dto-type';

export type ProgramMetrics = Dto<ProgramStats>;
export type ProgramRegistrationStatusStats = Dto<RegistrationStatusStats>;
export type ProgramRegistrationsCountByStatus = Record<
  RegistrationStatusEnum,
  number
>;
export type ProgramAggregatePerPayment = Dto<AggregatePerPayment>;
export type ProgramAggregatePerMonth = Dto<AggregatePerMonth>;
export type ProgramRegistrationCountByDate = Dto<RegistrationCountByDate>;

export interface SummaryMetric {
  value: null | number | string | undefined;
  label: string;
  showAlert?: boolean;
}
