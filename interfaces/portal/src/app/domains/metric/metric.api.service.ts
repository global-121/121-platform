import { HttpParamsOptions } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import { ProjectMetrics } from '~/domains/metric/metric.model';
import { unknownArrayToCsvBlob } from '~/utils/csv-helpers';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'programs',
  projectId,
  'metrics',
];

@Injectable({
  providedIn: 'root',
})
export class MetricApiService extends DomainApiService {
  getProjectSummaryMetrics(projectId: Signal<number | string>) {
    return this.generateQueryOptions<ProjectMetrics>({
      path: [...BASE_ENDPOINT(projectId), 'program-stats-summary'],
    });
  }

  exportMetrics({
    projectId,
    type,
    params,
  }: {
    projectId: Signal<number | string>;
    type: ExportType;
    params: HttpParamsOptions['fromObject'];
  }) {
    if (params?.format === 'json') {
      return this.generateQueryOptions<Dto<FileDto>, Blob>({
        path: [...BASE_ENDPOINT(projectId), 'export-list', type],
        params,
        processResponse: (response) => unknownArrayToCsvBlob(response.data), // TODO: The response.fileName is not used here we should consider using it or refactoring it out of the backend
      });
    }

    return this.generateQueryOptions<Blob>({
      path: [...BASE_ENDPOINT(projectId), 'export-list', type],
      params,
      responseAsBlob: true,
    });
  }

  public invalidateCache(projectId: Signal<number | string>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
