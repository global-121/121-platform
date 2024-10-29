import { inject, Injectable, Signal } from '@angular/core';

import { injectQueryClient } from '@tanstack/angular-query-experimental';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { EventApiService } from '~/domains/event/event.api.service';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  private queryClient = injectQueryClient();

  private paginateQueryService = inject(PaginateQueryService);
  private eventApiService = inject(EventApiService);
  private metricApiService = inject(MetricApiService);

  private generateExportParams({
    type,
    paginateQuery,
    fromDate,
    toDate,
    minPayment,
    maxPayment,
  }: {
    type: 'pa-data-changes' | ExportType;
    paginateQuery?: PaginateQuery;
    fromDate?: string;
    toDate?: string;
    minPayment?: number;
    maxPayment?: number;
  }) {
    if (type !== ExportType.allPeopleAffected && paginateQuery) {
      throw new Error('Paginate query is only supported for allPeopleAffected');
    }

    let params =
      this.paginateQueryService.paginateQueryToHttpParams(paginateQuery);

    params = params.append('format', 'xlsx');

    if (fromDate) {
      params = params.append('fromDate', fromDate);
    }
    if (toDate) {
      params = params.append('toDate', toDate);
    }
    if (minPayment) {
      params = params.append('minPayment', minPayment);
    }
    if (maxPayment) {
      params = params.append('maxPayment', maxPayment);
    }

    return params;
  }

  private toExportFileName(excelFileName: string): string {
    const date = new Date();
    return `${excelFileName}-${date.getFullYear().toString()}-${(
      date.getMonth() + 1
    ).toString()}-${date.getDate().toString()}.xlsx`;
  }

  async getExportList({
    projectId,
    type,
    paginateQuery,
    fromDate,
    toDate,
    minPayment,
    maxPayment,
  }: {
    projectId: Signal<number>;
    type: 'pa-data-changes' | ExportType;
    paginateQuery?: PaginateQuery;
    fromDate?: string;
    toDate?: string;
    minPayment?: number;
    maxPayment?: number;
  }) {
    const params = this.generateExportParams({
      type,
      paginateQuery,
      fromDate,
      toDate,
      minPayment,
      maxPayment,
    });

    let exportResult: Blob;

    if (type === 'pa-data-changes') {
      exportResult = await this.queryClient.fetchQuery(
        this.eventApiService.getEvents({
          projectId,
          params,
        })(),
      );
    } else {
      exportResult = await this.queryClient.fetchQuery(
        this.metricApiService.exportMetrics({
          projectId,
          type,
          params,
        })(),
      );
    }

    const filename = this.toExportFileName(type);

    return { exportResult, filename };
  }
}
