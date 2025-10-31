import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-start-payment',
  imports: [ButtonModule, FormDialogComponent, DataListComponent],
  templateUrl: './start-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPaymentComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();
  readonly fspList = input.required<string>();
  readonly transactionCount = input.required<string>();
  readonly totalPaymentAmount = input.required<string>();

  private metricApiService = inject(MetricApiService);
  private paymentApiService = inject(PaymentApiService);
  private toastService = inject(ToastService);

  readonly startPaymentDialog =
    viewChild.required<FormDialogComponent>('startPaymentDialog');

  startPaymentMutation = injectMutation(() => ({
    mutationFn: () =>
      this.paymentApiService.startPayment({
        projectId: this.projectId,
        paymentId: this.paymentId,
      }),
    onSuccess: () => {
      void this.metricApiService.invalidateCache(this.projectId);
      void this.paymentApiService.invalidateCache(
        this.projectId,
        this.paymentId,
      );
      this.startPaymentDialog().hide();
      this.toastService.showToast({
        detail: $localize`Payment started successfully.`,
      });
    },
  }));

  readonly dataList = computed<DataListItem[]>(() => [
    {
      label: $localize`Financial Service Provider(s)`,
      value: this.fspList(),
      type: 'text',
    },
    {
      label: $localize`Included in payment`,
      type: 'text',
      chipLabel: this.transactionCount(),
      chipVariant: 'blue',
    },
    {
      label: $localize`Total payment amount`,
      value: this.totalPaymentAmount(),
      type: 'text',
      tooltip: $localize`TBD`,
    },
  ]);

  openStartPaymentDialog() {
    this.startPaymentDialog().show();
  }
}
