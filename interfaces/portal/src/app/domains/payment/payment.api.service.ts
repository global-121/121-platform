import { Injectable, Signal } from '@angular/core';

import { ExcelReconciliationInstructions } from '@121-service/src/fsp-integrations/reconciliation/excel/dtos/excel-reconciliation-instructions.dto';
import { CreatePaymentDto } from '@121-service/src/payments/dto/create-payment.dto';
import { GetImportTemplateResponseDto } from '@121-service/src/payments/dto/get-import-template-response.dto';
import {
  BulkActionResultDto,
  BulkActionResultPaymentDto,
} from '@121-service/src/registration/dto/bulk-action-result.dto';
import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  Payment,
  PaymentAggregate,
  PaymentEventsResponse,
  PaymentStatus,
} from '~/domains/payment/payment.model';
import { FindAllTransactionsResult } from '~/domains/transaction/transaction.model';
import { PaginateQuery } from '~/services/paginate-query.service';
import { unknownArrayToCsvBlob } from '~/utils/csv-helpers';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (programId: Signal<number | string>) => [
  'programs',
  programId,
  'payments',
];

@Injectable({
  providedIn: 'root',
})
export class PaymentApiService extends DomainApiService {
  getPayments(programId: Signal<number | string>) {
    return this.generateQueryOptions<Payment[]>({
      path: [...BASE_ENDPOINT(programId)],
    });
  }

  getPayment({
    programId,
    paymentId,
  }: {
    programId: Signal<number | string | undefined>;
    paymentId: Signal<number | string | undefined>;
  }) {
    return this.generateQueryOptions<PaymentAggregate>({
      path: [...BASE_ENDPOINT(programId as Signal<number | string>), paymentId],
      enabled: () => !!programId() && !!paymentId(),
    });
  }

  getPaymentEvents({
    programId,
    paymentId,
  }: {
    programId: Signal<number | string | undefined>;
    paymentId: Signal<number | string | undefined>;
  }) {
    return this.generateQueryOptions<PaymentEventsResponse>({
      path: [
        ...BASE_ENDPOINT(programId as Signal<number | string>),
        paymentId,
        'events',
      ],
      enabled: () => !!programId() && !!paymentId(),
    });
  }

  getPaymentTransactions({
    programId,
    paymentId,
    paginateQuery,
  }: {
    programId: Signal<number | string | undefined>;
    paymentId: Signal<number | string | undefined>;
    paginateQuery: Signal<PaginateQuery | undefined>;
  }) {
    return this.generateQueryOptions<FindAllTransactionsResult>({
      path: [
        ...BASE_ENDPOINT(programId as Signal<number | string>),
        paymentId,
        'transactions',
      ],
      paginateQuery: paginateQuery as Signal<PaginateQuery>,
      enabled: () => !!programId() && !!paymentId() && !!paginateQuery,
    });
  }

  getPaymentStatus(programId: Signal<number | string>) {
    return this.generateQueryOptions<PaymentStatus>({
      path: [...BASE_ENDPOINT(programId), 'status'],
      refetchInterval: 3000,
    });
  }

  createPayment({
    programId,
    paginateQuery,
    paymentData,
    dryRun = true,
  }: {
    programId: Signal<number | string>;
    paginateQuery: PaginateQuery;
    paymentData: Dto<CreatePaymentDto>;
    dryRun?: boolean;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<BulkActionResultPaymentDto>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(programId)]).join('/'),
      body: paymentData,
      httpParams: {
        ...this.paginateQueryService.paginateQueryToHttpParamsObject(
          paginateQuery,
        ),
        dryRun,
      },
    });
  }

  startPayment({
    programId,
    paymentId,
  }: {
    programId: Signal<number | string>;
    paymentId: Signal<string>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        paymentId,
        'start',
      ]).join('/'),
    });
  }

  approvePayment({
    programId,
    paymentId,
    note,
  }: {
    programId: Signal<number | string>;
    paymentId: Signal<string>;
    note: Signal<string>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        paymentId,
        'approve',
      ]).join('/'),
      body: {
        note: note(),
      },
    });
  }

  retryFailedTransactions({
    programId,
    paymentId,
    paginateQuery,
    dryRun,
  }: {
    programId: Signal<number | string>;
    paymentId: number | string;
    paginateQuery: Signal<PaginateQuery | undefined>;
    dryRun: boolean;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<BulkActionResultDto>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        paymentId,
        'retry',
      ]).join('/'),
      httpParams: {
        ...this.paginateQueryService.paginateQueryToHttpParamsObject(
          paginateQuery(),
        ),
        dryRun,
      },
    });
  }

  exportFspInstructions({
    programId,
    paymentId,
  }: {
    programId: Signal<number | string>;
    paymentId: number | string;
  }) {
    return this.generateQueryOptions<Dto<ExcelReconciliationInstructions[]>>({
      path: [...BASE_ENDPOINT(programId), paymentId, 'fsp-instructions'],
      staleTime: 0,
    });
  }

  getReconciliationDataTemplates(programId: Signal<number | string>) {
    return this.generateQueryOptions<Dto<GetImportTemplateResponseDto>[]>({
      path: [...BASE_ENDPOINT(programId), 'excel-reconciliation', 'template'],
    });
  }

  async importReconciliationData({
    programId,
    paymentId,
    file,
  }: {
    paymentId: Signal<number | string>;
    programId: Signal<number | string>;
    file: File;
  }) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.httpWrapperService.perform121ServiceRequest<
      Dto<ImportResult>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        paymentId,
        'excel-reconciliation',
      ]).join('/'),
      body: formData,
      isUpload: true,
    });

    let blobResult: Blob | undefined;

    if (response.importResult) {
      blobResult = unknownArrayToCsvBlob(response.importResult);
    }

    return {
      ...response,
      blobResult,
    };
  }
}
