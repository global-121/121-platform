import {
  HttpErrorResponse,
  HttpParamsOptions,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';

import { injectQueryClient } from '@tanstack/angular-query-experimental';
import * as XLSX from 'xlsx';

import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { EventApiService } from '~/domains/event/event.api.service';
import { MetricApiService } from '~/domains/metric/metric.api.service';
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
  private queryClient = injectQueryClient();

  private paginateQueryService = inject(PaginateQueryService);
  private eventApiService = inject(EventApiService);
  private metricApiService = inject(MetricApiService);
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
    if (type !== ExportType.allPeopleAffected && paginateQuery) {
      throw new Error('Paginate query is only supported for allPeopleAffected');
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

  private toExportFileName(excelFileName: string): string {
    const date = new Date();
    return `${excelFileName}-${date.getFullYear().toString()}-${(
      date.getMonth() + 1
    ).toString()}-${date.getDate().toString()}.xlsx`;
  }

  getExportListMutation(projectId: Signal<number>, toastService: ToastService) {
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

        const filename = this.toExportFileName(type);

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

  downloadArrayToXlsx() {
    return ({ data, fileName }: { data: unknown[]; fileName: string }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook: XLSX.WorkBook = {
        Sheets: { data: worksheet },
        SheetNames: ['data'],
      };
      XLSX.writeFile(workbook, this.toExportFileName(fileName));
    };
  }

  downloadExport() {
    return ({
      exportResult,
      filename,
    }: {
      exportResult: Blob;
      filename: string;
    }) => {
      const downloadURL = window.URL.createObjectURL(exportResult);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = filename;
      link.click();
    };
  }

  private toAtributesForDuplicateCheckFilter(
    attributes: {
      name: string;
      duplicateCheck: boolean;
    }[],
  ) {
    return attributes
      .filter((attribute) => attribute.duplicateCheck)
      .map((attribute) => attribute.name);
  }

  async getDuplicateCheckAttributes(
    projectId: Signal<number>,
  ): Promise<string[]> {
    // TODO: AB#30519 This is a temporary solution until we have a better way to get all project attribute with the `duplicateCheck` flag included.
    // Ideally we will delete this function and just replace the call to `getDuplicateCheckAttributes` with a call to `getProjectAttributes`.
    const project = await this.queryClient.fetchQuery(
      this.projectApiService.getProject(projectId)(),
    );

    const {
      programQuestions,
      programCustomAttributes,
      financialServiceProviders,
    } = project;

    const fspAttributes = financialServiceProviders
      .map((fsp) => fsp.questions)
      .flat();

    const allAttributeNames: string[] = [
      ...this.toAtributesForDuplicateCheckFilter(programQuestions),
      ...this.toAtributesForDuplicateCheckFilter(programCustomAttributes),
      ...this.toAtributesForDuplicateCheckFilter(fspAttributes),
    ];

    return [...new Set(allAttributeNames)].sort((a, b) => a.localeCompare(b));
  }
}