import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import {
  injectMutation,
  injectQuery,
} from '@tanstack/angular-query-experimental';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-retry-transfers-dialog',
  imports: [FormDialogComponent],
  templateUrl: './retry-transfers-dialog.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetryTransfersDialogComponent {
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly metricApiService = inject(MetricApiService);
  readonly paymentApiService = inject(PaymentApiService);
  readonly toastService = inject(ToastService);

  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  readonly referenceIdsForRetryTransfers = signal<string[]>([]);

  readonly retryTransfersConfirmationDialog =
    viewChild.required<FormDialogComponent>('retryTransfersConfirmationDialog');

  retryFailedTransfersMutation = injectMutation(() => ({
    mutationFn: (referenceIds: string[]) =>
      this.paymentApiService.retryFailedTransfers({
        projectId: this.projectId,
        paymentId: this.paymentId(),
        referenceIds,
      }),
    onSuccess: () => {
      void this.metricApiService.invalidateCache(this.projectId);
      void this.paymentApiService.invalidateCache(
        this.projectId,
        this.paymentId,
      );
      setTimeout(() => {
        void this.metricApiService.invalidateCache(this.projectId);
        void this.paymentApiService.invalidateCache(
          this.projectId,
          this.paymentId,
        );
      }, 500);
    },
  }));

  public retryFailedTransfers({ referenceIds }: { referenceIds: string[] }) {
    if (this.paymentStatus.data()?.inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        detail: $localize`A payment is currently in progress. Please wait until it has finished.`,
      });
      return;
    }
    this.referenceIdsForRetryTransfers.set(referenceIds);
    this.retryTransfersConfirmationDialog().askForConfirmation();
  }
}
