import { Injectable, Signal } from '@angular/core';

import { CreatePaymentDto } from '@121-service/src/payments/dto/create-payment.dto';
import { FspInstructions } from '@121-service/src/payments/dto/fsp-instructions.dto';
import { RetryPaymentDto } from '@121-service/src/payments/dto/retry-payment.dto';
import { BulkActionResultPaymentDto } from '@121-service/src/registration/dto/bulk-action-result.dto';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  Payment,
  PaymentAggregate,
  PaymentStatus,
} from '~/domains/payment/payment.model';
import { PaginateQuery } from '~/services/paginate-query.service';
import { Dto } from '~/utils/dto-type';

const BASE_ENDPOINT = (projectId: Signal<number>) => [
  'programs',
  projectId,
  'payments',
];

@Injectable({
  providedIn: 'root',
})
export class PaymentApiService extends DomainApiService {
  getPayments(projectId: Signal<number>) {
    return this.generateQueryOptions<Payment[]>({
      path: [...BASE_ENDPOINT(projectId)],
    });
  }

  getPayment(
    projectId: Signal<number | undefined>,
    paymentId: Signal<number | undefined>,
  ) {
    return this.generateQueryOptions<PaymentAggregate>({
      path: [...BASE_ENDPOINT(projectId as Signal<number>), paymentId],
      enabled: () => !!projectId() && !!paymentId(),
    });
  }

  getPaymentStatus(projectId: Signal<number>) {
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
    projectId: Signal<number>;
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
    projectId: Signal<number>;
    paymentId: number;
    referenceIds: string[];
  }) {
    const body: Dto<RetryPaymentDto> = {
      payment: paymentId,
      referenceIds: {
        referenceIds,
      },
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
    projectId: Signal<number>;
    paymentId: string;
  }) {
    return this.generateQueryOptions<Dto<FspInstructions>>({
      path: [...BASE_ENDPOINT(projectId), paymentId, 'fsp-instructions'],
      staleTime: 0,
    });
  }

  public invalidateCache(
    projectId: Signal<number>,
    paymentId?: Signal<number>,
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
