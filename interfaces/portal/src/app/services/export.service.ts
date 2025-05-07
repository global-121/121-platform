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
  static toExportFileName(excelFileName: string): string {
    const date = new Date();
    return `${excelFileName}-${date.toISOString().slice(0, 10)}.xlsx`;
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
    minPayment,
    maxPayment,
  }: {
    type: 'pa-data-changes' | ExportType;
    paginateQuery?: PaginateQuery;
    fromDate?: Date;
    toDate?: Date;
    minPayment?: number;
    maxPayment?: number;
  }) {
    if (type !== ExportType.allRegistrations && paginateQuery) {
      throw new Error(
        `Paginate query is only supported for type: ${ExportType.allRegistrations}`,
      );
    }

    const exportParams: HttpParamsOptions['fromObject'] = {
      format: 'xlsx',
    };

    if (fromDate) {
      exportParams.fromDate = dateToIsoString(fromDate);
    }
    if (toDate) {
      // Add one day to include the selected date as the time is otherwise set to 00:00:00
      const toDateAdjusted = addDaysToDate(toDate, 1);
      exportParams.toDate = dateToIsoString(toDateAdjusted);
    }
    if (minPayment) {
      exportParams.minPayment = minPayment;
    }
    if (maxPayment) {
      exportParams.maxPayment = maxPayment;
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
      minPayment,
      maxPayment,
    }: {
      type: 'pa-data-changes' | ExportType;
      paginateQuery?: PaginateQuery;
      fromDate?: Date;
      toDate?: Date;
      minPayment?: number;
      maxPayment?: number;
    }) => {
      toastService.showToast({
        summary: $localize`Exporting`,
        detail: $localize`This might take a few minutes.\n\nThe file will be automatically downloaded when ready. Closing this notification will not cancel the export.`,
        severity: 'info',
        showSpinner: true,
      });

      const params = this.generateExportParams({
        type,
        paginateQuery,
        fromDate,
        toDate,
        minPayment,
        maxPayment,
      });

      try {
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

        const filename = ExportService.toExportFileName(type);

        return { exportResult, filename };
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
