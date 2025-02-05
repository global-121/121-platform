import { HttpParamsOptions } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  PaymentMetricDetails,
  ProjectMetrics,
} from '~/domains/metric/metric.model';

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
    return this.generateQueryOptions<Blob>({
      path: [...BASE_ENDPOINT(projectId), 'export-list', type],
      params,
      responseAsBlob: true,
    });
  }

  // Temporarily used while we wait for a paginated "get transactions" endpoint
  getPaymentData({
    projectId,
    payment,
  }: {
    projectId: Signal<number | string>;
    payment: Signal<number | string>;
  }) {
    return this.generateQueryOptions<
      { data: PaymentMetricDetails[] },
      PaymentMetricDetails[]
    >({
      path: [...BASE_ENDPOINT(projectId), 'export-list', ExportType.payment],
      params: {
        minPayment: payment,
        maxPayment: payment,
      },
      processResponse: (response) => response.data,
    });
  }

  public invalidateCache(projectId: Signal<number | string>): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(BASE_ENDPOINT(projectId)),
    });
  }
}
