import {
  HttpErrorResponse,
  HttpParamsOptions,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';

import { QueryClient } from '@tanstack/angular-query-experimental';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { EventApiService } from '~/domains/event/event.api.service';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import { addDaysToDate, dateToIsoString } from '~/utils/date';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  static toExportFileName(filename: string, extension: string): string {
    const date = new Date();
    return `${filename}-${date.toISOString().slice(0, 10)}.${extension}`;
  }

  private queryClient = inject(QueryClient);

  private paginateQueryService = inject(PaginateQueryService);
  private eventApiService = inject(EventApiService);
  private metricApiService = inject(MetricApiService);
  private paymentApiService = inject(PaymentApiService);
  private projectApiService = inject(ProjectApiService);

  private generateExportParams({
    type,
    paginateQuery,
    fromDate,
    toDate,
    format,
    paymentId,
  }: {
    type: 'pa-data-changes' | 'payment' | ExportType;
    paginateQuery?: PaginateQuery;
    fromDate?: Date;
    toDate?: Date;
    paymentId?: string;
    format: 'csv' | 'xlsx';
  }) {
    // TODO: AB#37529 refactor this so that TS can avoid any of these checks being necessary
    if (type !== ExportType.registrations && paginateQuery) {
      throw new Error(
        `Paginate query is only supported for type: ${ExportType.registrations}`,
      );
    }

    if (type !== 'payment' && !!paymentId) {
      throw new Error('PaymentId is only supported for type: payment');
    }

    if (
      !['pa-data-changes', 'payment'].includes(type) &&
      (!!fromDate || !!toDate)
    ) {
      throw new Error(
        'Date filters are only supported for type: pa-data-changes, payment',
      );
    }

    const exportParams: HttpParamsOptions['fromObject'] = {
      format: format === 'csv' ? 'json' : format,
    };

    if (fromDate) {
      exportParams.fromDate = dateToIsoString(fromDate);
    }
    if (toDate) {
      // Add one day to include the selected date as the time is otherwise set to 00:00:00
      const toDateAdjusted = addDaysToDate(toDate, 1);
      exportParams.toDate = dateToIsoString(toDateAdjusted);
    }
    if (paymentId) {
      exportParams.payment = paymentId;
    }

    const paginateQueryParams =
      this.paginateQueryService.paginateQueryToHttpParamsObject(paginateQuery);

    return {
      ...paginateQueryParams,
      ...exportParams,
    };
  }

  getExportCBEVerificationReportMutation(projectId: Signal<number | string>) {
    return async () => {
      const exportResult = await this.queryClient.fetchQuery(
        this.projectApiService.getCbeVerificationReport(projectId)(),
      );
      return exportResult;
    };
  }

  getExportListMutation(
    projectId: Signal<number | string>,
    toastService: ToastService,
  ) {
    return async ({
      type,
      paginateQuery,
      fromDate,
      toDate,
      paymentId,
      format = 'xlsx',
      filename,
    }: {
      type: 'pa-data-changes' | 'payment' | ExportType;
      paginateQuery?: PaginateQuery;
      fromDate?: Date;
      toDate?: Date;
      paymentId?: string;
      format?: 'csv' | 'xlsx';
      filename?: string;
    }) => {
      toastService.showToast({
        summary: $localize`Exporting`,
        detail: $localize`This might take a few minutes.\n\nThe file will be automatically downloaded when ready. Closing this notification will not cancel the export.`,
        severity: 'info',
        showSpinner: true,
      });

      if (format !== 'xlsx' && type !== ExportType.registrations) {
        throw new Error(
          `Export format ${format} is currently not supported for type: ${type}`,
        );
      }

      const params = this.generateExportParams({
        type,
        paginateQuery,
        fromDate,
        toDate,
        paymentId,
        format,
      });

      try {
        let exportResult: Blob;

        // TODO: AB#37529 refactor this to avoid the hardcoded types and the if
        if (type === 'pa-data-changes') {
          exportResult = await this.queryClient.fetchQuery(
            this.eventApiService.getEvents({
              projectId,
              params,
            })(),
          );
        } else if (type === 'payment') {
          exportResult = await this.queryClient.fetchQuery(
            this.projectApiService.getTransactions({
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

        const outputFilename = ExportService.toExportFileName(
          filename ?? type,
          format,
        );

        return { exportResult, filename: outputFilename };
      } catch (error) {
        if (
          error instanceof HttpErrorResponse &&
          error.status === (HttpStatusCode.NotFound as number)
        ) {
          throw new Error($localize`There is currently no data to export`);
        }
        throw error;
      }
    };
  }

  exportFspInstructions({
    projectId,
    toastService,
  }: {
    projectId: Signal<number | string>;
    toastService: ToastService;
  }) {
    return async ({ paymentId }: { paymentId: string }) => {
      const exportResult = await this.queryClient.fetchQuery(
        this.paymentApiService.exportFspInstructions({
          projectId,
          paymentId,
        })(),
      );

      toastService.showToast({
        summary: $localize`Exporting FSP Instructions`,
        detail: $localize`This might take a few minutes.\n\nThe file will be automatically downloaded when ready. Closing this notification will not cancel the export.`,
        severity: 'info',
        showSpinner: true,
      });

      return exportResult.map((fspInstructionPerProgramFspConfig) => {
        const exportFileName = `payment#${paymentId}-${fspInstructionPerProgramFspConfig.fileNamePrefix}-fsp-instructions`;

        return {
          data: fspInstructionPerProgramFspConfig.data,
          fileName: exportFileName,
        };
      });
    };
  }
}
