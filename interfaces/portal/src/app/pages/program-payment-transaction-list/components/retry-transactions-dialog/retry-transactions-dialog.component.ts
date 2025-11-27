import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import {
  FilterOperator,
  PaginateQuery,
} from '~/services/paginate-query.service';
import { ToastService } from '~/services/toast.service';
import {
  TrackingAction,
  TrackingCategory,
  TrackingService,
} from '~/services/tracking.service';

@Component({
  selector: 'app-retry-transactions-dialog',
  imports: [FormDialogComponent],
  templateUrl: './retry-transactions-dialog.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetryTransactionsDialogComponent {
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();
  readonly paginateQuery = input.required<PaginateQuery | undefined>();

  readonly metricApiService = inject(MetricApiService);
  readonly paymentApiService = inject(PaymentApiService);
  readonly toastService = inject(ToastService);
  readonly trackingService = inject(TrackingService);

  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.programId),
  );

  readonly referenceIdsForRetryTransactions = signal<string[] | undefined>([]);
  readonly transactionCount = signal<number>(0);

  readonly retryTransactionsConfirmationDialog =
    viewChild.required<FormDialogComponent>(
      'retryTransactionsConfirmationDialog',
    );

  retryFailedTransactionsMutation = injectMutation(() => ({
    mutationFn: () =>
      this.paymentApiService.retryFailedTransactions({
        programId: this.programId,
        paymentId: this.paymentId(),
        paginateQuery: this.retryFailedTransactionsPaginateQuery,
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

  readonly registrationReferenceIdFilter = computed(() => {
    const referenceIds = this.referenceIdsForRetryTransactions();

    if (!referenceIds) {
      return '';
    }

    return `${FilterOperator.IN}:${referenceIds.join(',')}`;
  });

  readonly retryFailedTransactionsPaginateQuery = computed<PaginateQuery>(
    () => {
      const paginateQuery = {
        ...this.paginateQuery(),
        filter: {
          ...this.paginateQuery()?.filter,
          registrationReferenceId: this.registrationReferenceIdFilter(),
        },
      };
      return paginateQuery;
    },
  );

  public retryFailedTransactions({
    transactionCount,
    referenceIds,
  }: {
    transactionCount: number;
    referenceIds: string[] | undefined;
  }) {
    const eventName =
      transactionCount === 1
        ? 'retry-transaction:single'
        : 'retry-transaction:multiple';
    this.trackingService.trackEvent({
      category: TrackingCategory.manageTransactions,
      action: TrackingAction.clickRetryTransactionButton,
      name: eventName,
      value: transactionCount,
    });

    if (this.paymentStatus.data()?.inProgress) {
      this.toastService.showToast({
        severity: 'warn',
        detail: $localize`A payment is currently in progress. Please wait until it has finished.`,
      });
      return;
    }

    this.referenceIdsForRetryTransactions.set(referenceIds);
    this.transactionCount.set(transactionCount);
    this.retryTransactionsConfirmationDialog().show({
      trackingEvent: {
        category: TrackingCategory.manageTransactions,
        action: TrackingAction.clickProceedButton,
        name: eventName,
        value: transactionCount,
      },
    });
  }
}
