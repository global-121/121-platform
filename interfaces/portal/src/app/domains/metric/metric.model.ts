import { ProjectStats } from '@121-service/src/metrics/dto/project-stats.dto';

import { Dto } from '~/utils/dto-type';

export type ProjectMetrics = Dto<ProjectStats>;

export interface SummaryMetric {
  value: null | number | string | undefined;
  label: string;
  showAlert?: boolean;
}
