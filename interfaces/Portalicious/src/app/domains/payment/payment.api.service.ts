import { Injectable, Signal } from '@angular/core';
import { DomainApiService } from '~/domains/domain-api.service';
import { Payment } from '~/domains/payment/payment.model';

const BASE_ENDPOINT = (paymentId: Signal<number>) => [
  'programs',
  paymentId,
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

  getPayment(projectId: Signal<number>, paymentId: Signal<number>) {
    return this.generateQueryOptions<Payment[]>({
      path: [...BASE_ENDPOINT(projectId), paymentId],
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
