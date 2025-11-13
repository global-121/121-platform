import { Injectable, Signal } from '@angular/core';

import { CreatePaymentDto } from '@121-service/src/payments/dto/create-payment.dto';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { GetImportTemplateResponseDto } from '@121-service/src/payments/dto/get-import-template-response.dto';
import { RetryPaymentDto } from '@121-service/src/payments/dto/retry-payment.dto';
import { BulkActionResultPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';
import { ImportResult } from '@121-service/src/registration/dto/bulk-import.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  Payment,
  PaymentAggregate,
  PaymentEventsResponse,
  PaymentStatus,
  PaymentTransaction,
} from '~/domains/payment/payment.model';
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
  }: {
    programId: Signal<number | string | undefined>;
    paymentId: Signal<number | string | undefined>;
  }) {
    return this.generateQueryOptions<PaymentTransaction[]>({
      path: [
        ...BASE_ENDPOINT(programId as Signal<number | string>),
        paymentId,
        'transactions',
      ],
      enabled: () => !!programId() && !!paymentId(),
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
    projectId,
    paymentId,
  }: {
    projectId: Signal<number | string>;
    paymentId: Signal<string>;
  }) {
    return this.httpWrapperService.perform121ServiceRequest({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
        paymentId,
      ]).join('/'),
    });
  }

  retryFailedTransfers({
    programId,
    paymentId,
    referenceIds,
  }: {
    programId: Signal<number | string>;
    paymentId: number | string;
    referenceIds: string[];
  }) {
    const body: Dto<RetryPaymentDto> = {
      referenceIds,
    };

    return this.httpWrapperService.perform121ServiceRequest<
      Dto<BulkActionResultPaymentDto>
    >({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(programId),
        paymentId,
      ]).join('/'),
      body,
      httpParams: {
        retry: 'true',
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
    return this.generateQueryOptions<Dto<FspInstructions[]>>({
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

  public invalidateCache(
    programId: Signal<number | string>,
    paymentId?: Signal<number | string>,
  ): Promise<void> {
    const path = [...BASE_ENDPOINT(programId)];

    if (paymentId) {
      path.push(paymentId);
    }

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
