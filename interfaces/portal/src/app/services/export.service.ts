import {
  HttpErrorResponse,
  HttpParamsOptions,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';

import {
  CreateMutationOptions,
  FetchQueryOptions,
  QueryClient,
} from '@tanstack/angular-query-experimental';

import { CommercialBankEthiopiaValidationReportDto } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/dto/commercial-bank-ethiopia-validation-report.dto';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';

import { EventApiService } from '~/domains/event/event.api.service';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { DownloadService } from '~/services/download.service';
import {
  PaginateQuery,
  PaginateQueryService,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import { addDaysToDate, dateToIsoString } from '~/utils/date';
import { Dto } from '~/utils/dto-type';

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
  private downloadService = inject(DownloadService);
  private eventApiService = inject(EventApiService);
  private metricApiService = inject(MetricApiService);
  private paymentApiService = inject(PaymentApiService);
  private programApiService = inject(ProgramApiService);

  private generateExportParams({
    format,
    paginateQuery,
    fromDate,
    toDate,
    paymentId,
  }: {
    format: 'csv' | 'xlsx';
    paginateQuery?: PaginateQuery;
    fromDate?: Date;
    toDate?: Date;
    paymentId?: string;
  }) {
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
      exportParams.paymentId = paymentId;
    }

    const paginateQueryParams =
      this.paginateQueryService.paginateQueryToHttpParamsObject(paginateQuery);

    return {
      ...paginateQueryParams,
      ...exportParams,
    };
  }

  private showStartExportToast(toastService: ToastService) {
    toastService.showToast({
      summary: $localize`Exporting`,
      detail: $localize`This might take a few minutes.\n\nThe file will be automatically downloaded when ready. Closing this notification will not cancel the export.`,
      severity: 'info',
      showSpinner: true,
    });
  }

  getExportCBEVerificationReportMutation(
    programId: Signal<number | string>,
    toastService: ToastService,
  ): CreateMutationOptions<Dto<CommercialBankEthiopiaValidationReportDto>> {
    return {
      mutationFn: async () => {
        this.showStartExportToast(toastService);

        return await this.queryClient.fetchQuery(
          this.programApiService.getCbeVerificationReport(programId)(),
        );
      },
      onSuccess: this.downloadService.downloadArrayToXlsx.bind(this),
    };
  }

  getExportByTypeMutation(
    programId: Signal<number | string>,
    toastService: ToastService,
  ): CreateMutationOptions<
    { file: Blob; filename: string },
    Error,
    {
      filename?: string;
    } &
      // this is where we define which export types support which parameters
      (| {
            type: 'payments';
            fromDate?: Date;
            toDate?: Date;
            paymentId?: string;
          }
        | {
            type: 'registration-data-changes';
            fromDate?: Date;
            toDate?: Date;
          }
        | {
            type: ExportType;
          }
        | {
            type: ExportType.registrations;
            paginateQuery?: PaginateQuery;
            format?: 'csv' | 'xlsx';
          }
      )
  > {
    return {
      mutationFn: async ({ type, filename, ...options }) => {
        this.showStartExportToast(toastService);

        const format =
          'format' in options ? (options.format ?? 'xlsx') : 'xlsx';

        const params = this.generateExportParams({
          ...options,
          format,
        });

        let query: FetchQueryOptions<Blob>;

        switch (type) {
          case 'payments':
            query = this.programApiService.getTransactions({
              programId,
              params,
            })();
            break;
          case 'registration-data-changes':
            query = this.eventApiService.getEvents({
              programId,
              params,
            })();
            break;
          default:
            query = this.metricApiService.exportMetrics({
              programId,
              type,
              params,
            })();
        }

        try {
          const file = await this.queryClient.fetchQuery(query);
          return {
            file,
            filename: ExportService.toExportFileName(filename ?? type, format),
          };
        } catch (error) {
          if (
            error instanceof HttpErrorResponse &&
            error.status === (HttpStatusCode.NotFound as number)
          ) {
            throw new Error($localize`There is currently no data to export`);
          }
          throw error;
        }
      },
      onSuccess: this.downloadService.downloadFile.bind(this),
    };
  }

  getExportFspInstructionsMutation(
    programId: Signal<number | string>,
    toastService: ToastService,
  ): CreateMutationOptions<
    { data: Record<string, unknown>[]; fileName: string }[],
    Error,
    { paymentId: string }
  > {
    return {
      mutationFn: async ({ paymentId }) => {
        this.showStartExportToast(toastService);

        const exportResult = await this.queryClient.fetchQuery(
          this.paymentApiService.exportFspInstructions({
            programId,
            paymentId,
          })(),
        );

        return exportResult.map((fspInstructionPerProgramFspConfig) => {
          const exportFileName = `payment#${paymentId}-${fspInstructionPerProgramFspConfig.fileNamePrefix}-fsp-instructions`;

          return {
            data: fspInstructionPerProgramFspConfig.data,
            fileName: exportFileName,
          };
        });
      },
      onSuccess: (filesToExport) => {
        filesToExport.forEach((fileToExport) => {
          void this.downloadService.downloadArrayToXlsx(fileToExport);
        });
      },
    };
  }
}
