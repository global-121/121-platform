import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { RegistrationStatusStats } from '@121-service/src/metrics/dto/registrationstatus-stats.dto';
import { RegistrationCountByDate } from '@121-service/src/metrics/dto/registration-count-by-date.dto';
import {
  AggregatePerMonth,
  AggregatePerPayment,
} from '@121-service/src/metrics/dto/payment-aggregate.dto';

import { Dto } from '~/utils/dto-type';

export type ProjectMetrics = Dto<ProgramStats>;
export type ProjectRegistrationStatusStats = Dto<RegistrationStatusStats>;
export type ProjectAggregatePerPayment = Dto<AggregatePerPayment>;
export type ProjectAggregatePerMonth = Dto<AggregatePerMonth>;
export type ProjectRegistrationCountByDate = Dto<RegistrationCountByDate>;

export interface SummaryMetric {
  value: null | number | string | undefined;
  label: string;
  showAlert?: boolean;
}
