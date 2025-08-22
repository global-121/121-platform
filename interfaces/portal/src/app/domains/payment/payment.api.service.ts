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

const BASE_ENDPOINT = (projectId: Signal<number | string>) => [
  'programs',
  projectId,
  'payments',
];

@Injectable({
  providedIn: 'root',
})
export class PaymentApiService extends DomainApiService {
  getPayments(projectId: Signal<number | string>) {
    return this.generateQueryOptions<Payment[]>({
      path: [...BASE_ENDPOINT(projectId)],
    });
  }

  getPayment({
    projectId,
    paymentId,
  }: {
    projectId: Signal<number | string | undefined>;
    paymentId: Signal<number | string | undefined>;
  }) {
    return this.generateQueryOptions<PaymentAggregate>({
      path: [...BASE_ENDPOINT(projectId as Signal<number | string>), paymentId],
      enabled: () => !!projectId() && !!paymentId(),
    });
  }

  getPaymentEvents({
    projectId,
    paymentId,
  }: {
    projectId: Signal<number | string | undefined>;
    paymentId: Signal<number | string | undefined>;
  }) {
    return this.generateQueryOptions<PaymentEventsResponse>({
      path: [
        ...BASE_ENDPOINT(projectId as Signal<number | string>),
        paymentId,
        'events',
      ],
      enabled: () => !!projectId() && !!paymentId(),
    });
  }

  getPaymentTransactions({
    projectId,
    paymentId,
  }: {
    projectId: Signal<number | string | undefined>;
    paymentId: Signal<number | string | undefined>;
  }) {
    return this.generateQueryOptions<PaymentTransaction[]>({
      path: [
        ...BASE_ENDPOINT(projectId as Signal<number | string>),
        paymentId,
        'transactions',
      ],
      enabled: () => !!projectId() && !!paymentId(),
    });
  }

  getProjectTransactions({
    projectId,
  }: {
    projectId: Signal<number | string | undefined>;
  }) {
    return this.generateQueryOptions<PaymentTransaction[]>({
      path: [...BASE_ENDPOINT(projectId as Signal<number | string>)],
    });
  }

  getPaymentStatus(projectId: Signal<number | string>) {
    return this.generateQueryOptions<PaymentStatus>({
      path: [...BASE_ENDPOINT(projectId), 'status'],
      refetchInterval: 3000,
    });
  }

  createPayment({
    projectId,
    paginateQuery,
    paymentData,
    dryRun = true,
  }: {
    projectId: Signal<number | string>;
    paginateQuery: PaginateQuery;
    paymentData: Dto<CreatePaymentDto>;
    dryRun?: boolean;
  }) {
    return this.httpWrapperService.perform121ServiceRequest<
      Dto<BulkActionResultPaymentDto>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(projectId)]).join('/'),
      body: paymentData,
      httpParams: {
        ...this.paginateQueryService.paginateQueryToHttpParamsObject(
          paginateQuery,
        ),
        dryRun,
      },
    });
  }

  retryFailedTransfers({
    projectId,
    paymentId,
    referenceIds,
  }: {
    projectId: Signal<number | string>;
    paymentId: number | string;
    referenceIds: string[];
  }) {
    const body: Dto<RetryPaymentDto> = {
      paymentId: Number(paymentId),
      referenceIds,
    };

    return this.httpWrapperService.perform121ServiceRequest<
      Dto<BulkActionResultPaymentDto>
    >({
      method: 'PATCH',
      endpoint: this.pathToQueryKey([...BASE_ENDPOINT(projectId)]).join('/'),
      body,
    });
  }

  exportFspInstructions({
    projectId,
    paymentId,
  }: {
    projectId: Signal<number | string>;
    paymentId: number | string;
  }) {
    return this.generateQueryOptions<Dto<FspInstructions[]>>({
      path: [...BASE_ENDPOINT(projectId), paymentId, 'fsp-instructions'],
      staleTime: 0,
    });
  }

  getReconciliationDataTemplates(projectId: Signal<number | string>) {
    return this.generateQueryOptions<Dto<GetImportTemplateResponseDto>[]>({
      path: [...BASE_ENDPOINT(projectId), 'excel-reconciliation', 'template'],
    });
  }

  async importReconciliationData({
    projectId,
    paymentId,
    file,
  }: {
    paymentId: Signal<number | string>;
    projectId: Signal<number | string>;
    file: File;
  }) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.httpWrapperService.perform121ServiceRequest<
      Dto<ImportResult>
    >({
      method: 'POST',
      endpoint: this.pathToQueryKey([
        ...BASE_ENDPOINT(projectId),
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
    projectId: Signal<number | string>,
    paymentId?: Signal<number | string>,
  ): Promise<void> {
    const path = [...BASE_ENDPOINT(projectId)];

    if (paymentId) {
      path.push(paymentId);
    }

    return this.queryClient.invalidateQueries({
      queryKey: this.pathToQueryKey(path),
    });
  }
}
