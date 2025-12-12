import { HttpParamsOptions } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';

import { FileDto } from '@121-service/src/metrics/dto/file.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  ProgramAggregatePerMonth,
  ProgramAggregatePerPayment,
  ProgramMetrics,
  ProgramRegistrationCountByDate,
  ProgramRegistrationsCountByStatus,
  ProgramRegistrationStatusStats,
} from '~/domains/metric/metric.model';
import { unknownArrayToCsvBlob } from '~/utils/csv-helpers';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'metrics',
];

@Injectable({
  providedIn: 'root',
})
export class MetricApiService extends DomainApiService {
  getProgramSummaryMetrics(programId: Signal<number | string>) {
    return this.generateQueryOptions<ProgramMetrics>({
      path: [...BASE_ENDPOINT(programId), 'program-stats-summary'],
    });
  }

  exportMetrics({
    programId,
    type,
    params,
  }: {
    programId: Signal<number | string>;
    type: ExportType;
    params: Exclude<HttpParamsOptions['fromObject'], undefined>; // `params` should/will always have a value
  }) {
    params['filter.status'] =
      this.paginateQueryService.extendStatusFilterToExcludeDeleted(
        params['filter.status'] as string,
      );

    if (params.format === 'json') {
      return this.generateQueryOptions<Dto<FileDto>, Blob>({
        path: [...BASE_ENDPOINT(programId), 'export-list', type],
        params,
        processResponse: (response) => unknownArrayToCsvBlob(response.data), // TODO: The response.fileName is not used here we should consider using it or refactoring it out of the backend
      });
    }

    return this.generateQueryOptions<Blob>({
      path: [...BASE_ENDPOINT(programId), 'export-list', type],
      params,
      responseAsBlob: true,
    });
  }

  getRegistrationCountByStatus({
    programId,
  }: {
    programId: Signal<number | string>;
  }) {
    return this.generateQueryOptions<
      ProgramRegistrationStatusStats[],
      ProgramRegistrationsCountByStatus
    >({
      path: [...BASE_ENDPOINT(programId), 'registration-status'],
      processResponse: (response) =>
        response.reduce((statusObject, currentStatus) => {
          statusObject[currentStatus.status] = currentStatus.statusCount;

          return statusObject;
        }, {} as ProgramRegistrationsCountByStatus),
    });
  }

  getAllPaymentsAggregates({
    programId,
    limitNumberOfPayments,
  }: {
    programId: Signal<number | string>;
    limitNumberOfPayments?: string;
  }) {
    let params = {};
    if (limitNumberOfPayments) {
      params = { ...params, limitNumberOfPayments };
    }
    return this.generateQueryOptions<ProgramAggregatePerPayment[]>({
      path: [...BASE_ENDPOINT(programId), 'all-payments-aggregates'],
      params,
    });
  }

  getAmountSentByMonth({
    programId,
    limitNumberOfPayments,
  }: {
    programId: Signal<number | string>;
    limitNumberOfPayments?: number;
  }) {
    let params = {};
    if (limitNumberOfPayments) {
      params = {
        ...params,
        limitNumberOfPayments: limitNumberOfPayments.toString(),
      };
    }
    return this.generateQueryOptions<ProgramAggregatePerMonth>({
      path: [...BASE_ENDPOINT(programId), 'amount-sent-by-month'],
      params,
    });
  }

  getRegistrationCountByDate({
    programId,
    startDate,
  }: {
    programId: Signal<number | string>;
    startDate?: string;
  }) {
    let params = {};
    if (startDate) {
      params = { ...params, startDate };
    }

    return this.generateQueryOptions<ProgramRegistrationCountByDate>({
      path: [...BASE_ENDPOINT(programId), 'registration-count-by-date'],
      params,
    });
  }
}
