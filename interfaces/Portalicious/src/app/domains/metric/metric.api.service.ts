import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import { ProjectMetrics } from '~/domains/metric/metric.model';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'metrics',
];

@Injectable({
  providedIn: 'root',
})
export class MetricApiService extends DomainApiService {
  getProjectSummaryMetrics(projectId: Signal<number>) {
    return this.generateQueryOptions<ProjectMetrics>({
      path: [...BASE_ENDPOINT(projectId), 'program-stats-summary'],
    });
  }

  public invalidateCache(projectId: Signal<number>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
