import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';

import { Dto } from '~/utils/dto-type';

export type ProjectMetrics = Dto<ProgramStats>;

export interface SummaryMetric {
  value: null | number | string | undefined;
  label: string;
  type?: string;
  showAlert?: boolean;
}
