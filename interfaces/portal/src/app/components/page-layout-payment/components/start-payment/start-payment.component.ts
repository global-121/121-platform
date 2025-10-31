import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-start-payment',
  imports: [ButtonModule, FormDialogComponent],
  templateUrl: './start-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPaymentComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly projectId = input.required<string>();
  readonly paymentId = input.required<string>();

  private metricApiService = inject(MetricApiService);
  private paymentApiService = inject(PaymentApiService);

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
      // this.toastService.showToast({
      //   detail: $localize`Reconciliation data imported successfully.`,
      // });
    },
  }));

  openStartPaymentDialog() {
    this.startPaymentDialog().show();
  }
}
