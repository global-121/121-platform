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

  readonly dryRunResult = signal<
    | {
        totalFilterCount: number;
        applicableCount: number;
        nonApplicableCount: number;
      }
    | undefined
  >(undefined);

  retryFailedTransactionsMutation = injectMutation(() => ({
    mutationFn: ({ dryRun }: { dryRun: boolean }) =>
      this.paymentApiService.retryFailedTransactions({
        programId: this.programId,
        paymentId: this.paymentId(),
        paginateQuery: this.retryFailedTransactionsPaginateQuery,
        dryRun,
      }),
    onSuccess: (data, variables) => {
      if (variables.dryRun) {
        this.dryRunResult.set(data);
        this.retryTransactionsConfirmationDialog().show({
          trackingEvent: {
            category: TrackingCategory.manageTransactions,
            action: TrackingAction.clickProceedButton,
            name: this.trackingEventName(),
            value: this.trackingValue(),
          },
        });
        return;
      }
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
    onError: (error) => {
      this.toastService.showToast({
        severity: 'error',
        detail: error.message,
      });
    },
  }));

  readonly registrationReferenceIdFilter = computed(() => {
    const referenceIds = this.referenceIdsForRetryTransactions();

    if (!referenceIds) {
      return undefined;
    }

    return `${FilterOperator.IN}:${referenceIds.join(',')}`;
  });

  readonly retryFailedTransactionsPaginateQuery = computed<PaginateQuery>(
    () => {
      const paginateQuery = {
        ...this.paginateQuery(),
        filter: {
          ...this.paginateQuery()?.filter,
        },
      };

      const registrationReferenceIdFilter =
        this.registrationReferenceIdFilter();

      if (registrationReferenceIdFilter) {
        paginateQuery.filter.registrationReferenceId =
          registrationReferenceIdFilter;
      }

      return paginateQuery;
    },
  );

  private readonly trackingEventName = signal<string>('');
  private readonly trackingValue = signal<number>(0);

  public retryFailedTransactions({
    transactionCount,
    referenceIds,
  }: {
    transactionCount: number;
    referenceIds: string[] | undefined;
  }) {
    this.trackingEventName.set(
      transactionCount === 1
        ? 'retry-transaction:single'
        : 'retry-transaction:multiple',
    );
    this.trackingValue.set(transactionCount);

    this.trackingService.trackEvent({
      category: TrackingCategory.manageTransactions,
      action: TrackingAction.clickRetryTransactionButton,
      name: this.trackingEventName(),
      value: this.trackingValue(),
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
    this.retryFailedTransactionsMutation.mutate({ dryRun: true });
  }
}
