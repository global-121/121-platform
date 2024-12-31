import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';

import { ConfirmationDialogComponent } from '~/components/confirmation-dialog/confirmation-dialog.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentMetricDetails } from '~/domains/metric/metric.model';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-retry-transfers-dialog',
  imports: [ConfirmationDialogComponent],
  templateUrl: './retry-transfers-dialog.component.html',
  styles: ``,
  providers: [ToastService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetryTransfersDialogComponent {
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  private metricApiService = inject(MetricApiService);
  private paymentApiService = inject(PaymentApiService);
  private toastService = inject(ToastService);

  referenceIdsForRetryTransfers = signal<string[]>([]);

  readonly retryTransfersConfirmationDialog =
    viewChild.required<ConfirmationDialogComponent>(
      'retryTransfersConfirmationDialog',
    );

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
    },
  }));

  public retryFailedTransfers({
    table,
    triggeredFromContextMenu,
    contextMenuItem,
  }: {
    table: QueryTableComponent<PaymentMetricDetails, never>;
    triggeredFromContextMenu: boolean;
    contextMenuItem?: PaymentMetricDetails;
  }) {
    const actionData = table.getActionData({
      triggeredFromContextMenu,
      contextMenuItem,
      fieldForFilter: 'referenceId',
      noSelectionToastMessage: $localize`:@@no-registrations-selected:Select one or more registrations and try again.`,
    });

    if (!actionData) {
      return;
    }

    const selection = actionData.selection;

    if (!Array.isArray(selection) || selection.length === 0) {
      this.toastService.showGenericError(); // Should never happen
      return;
    }

    const referenceIds = selection.map(
      (transaction) => transaction.referenceId,
    );

    this.referenceIdsForRetryTransfers.set(referenceIds);
    this.retryTransfersConfirmationDialog().askForConfirmation();
  }
}
