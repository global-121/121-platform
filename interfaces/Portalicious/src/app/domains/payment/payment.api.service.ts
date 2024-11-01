import { Injectable, Signal } from '@angular/core';

import { DomainApiService } from '~/domains/domain-api.service';
import {
  Payment,
  PaymentAggregate,
  PaymentStatus,
} from '~/domains/payment/payment.model';

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

  getPayment(projectId: Signal<number>, paymentId: Signal<number | undefined>) {
    return this.generateQueryOptions<PaymentAggregate>({
      path: [...BASE_ENDPOINT(projectId), paymentId],
      enabled: () => !!paymentId(),
    });
  }

  getPaymentStatus(projectId: Signal<number>) {
    return this.generateQueryOptions<PaymentStatus, boolean>({
      path: [...BASE_ENDPOINT(projectId), 'status'],
      processResponse: (response) => {
        return !!response.inProgress;
      },
      enabled: () => !!projectId(),
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
