import { HttpParams } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import { ProjectMetrics } from '~/domains/metric/metric.model';
import { PaginateQueryService } from '~/services/paginate-query.service';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'metrics',
];

@Injectable({
  providedIn: 'root',
})
export class MetricApiService extends DomainApiService {
  paginateQueryService = inject(PaginateQueryService);

  getProjectSummaryMetrics(projectId: Signal<number>) {
    return this.generateQueryOptions<ProjectMetrics>({
      path: [...BASE_ENDPOINT(projectId), 'program-stats-summary'],
    });
  }

  exportMetrics({
    projectId,
    type,
    params,
  }: {
    projectId: Signal<number>;
    type: ExportType;
    params: HttpParams;
  }) {
    return this.generateQueryOptions<Blob>({
      path: [...BASE_ENDPOINT(projectId), 'export-list', type],
      requestOptions: {
        params,
        responseAsBlob: true,
      },
    });
  }

  public invalidateCache(projectId: Signal<number>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
