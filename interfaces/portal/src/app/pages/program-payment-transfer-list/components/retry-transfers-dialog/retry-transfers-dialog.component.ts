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
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

@Component({
  selector: 'app-retry-transfers-dialog',
  imports: [FormDialogComponent],
  templateUrl: './retry-transfers-dialog.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetryTransfersDialogComponent {
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();

  readonly metricApiService = inject(MetricApiService);
  readonly paymentApiService = inject(PaymentApiService);
  readonly toastService = inject(ToastService);
  readonly trackingService = inject(TrackingService);

  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );

  readonly referenceIdsForRetryTransfers = signal<string[]>([]);

  readonly retryTransfersConfirmationDialog =
    viewChild.required<FormDialogComponent>('retryTransfersConfirmationDialog');

  retryFailedTransfersMutation = injectMutation(() => ({
    mutationFn: (referenceIds: string[]) =>
      this.paymentApiService.retryFailedTransfers({
        programId: this.programId,
        paymentId: this.paymentId(),
        referenceIds,
      }),
    onSuccess: () => {
      void this.metricApiService.invalidateCache(this.programId);
      void this.paymentApiService.invalidateCache(
        this.programId,
        this.paymentId,
      );
      setTimeout(() => {
        void this.metricApiService.invalidateCache(this.programId);
        void this.paymentApiService.invalidateCache(
          this.programId,
          this.paymentId,
        );
      }, 500);
    },
  }));

  public retryFailedTransfers({ referenceIds }: { referenceIds: string[] }) {
    const eventName =
      referenceIds.length === 1
        ? 'retry-transaction:single'
        : 'retry-transaction:multiple';
    this.trackingService.trackEvent({
      category: TrackingCategory.manageTransactions,
      action: TrackingAction.clickRetryTransactionButton,
      name: eventName,
      value: referenceIds.length,
    });

    if (this.paymentStatus.data()?.inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        detail: $localize`A payment is currently in progress. Please wait until it has finished.`,
      });
      return;
    }

    this.referenceIdsForRetryTransfers.set(referenceIds);
    this.retryTransfersConfirmationDialog().show({
      trackingEvent: {
        category: TrackingCategory.manageTransactions,
        action: TrackingAction.clickProceedButton,
        name: eventName,
        value: referenceIds.length,
      },
    });
  }
}
