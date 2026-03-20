import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { injectMutation } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import { AppRoutes } from '~/app.routes';
import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-delete-payment',
  imports: [ButtonModule, FormDialogComponent],
  templateUrl: './delete-payment.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePaymentComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly programId = input.required<string>();
  readonly paymentId = input.required<string>();

  private paymentApiService = inject(PaymentApiService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  readonly deletePaymentDialog =
    viewChild.required<FormDialogComponent>('deletePaymentDialog');

  deletePaymentMutation = injectMutation(() => ({
    mutationFn: () =>
      this.paymentApiService.deletePayment({
        programId: this.programId,
        paymentId: this.paymentId,
      }),
    onSuccess: async () => {
      this.deletePaymentDialog().hide();
      this.toastService.showToast({
        detail: $localize`Payment deleted.`,
      });
      await this.router.navigate([
        '/',
        AppRoutes.program,
        this.programId(),
        AppRoutes.programPayments,
      ]);
    },
  }));

  openDeletePaymentDialog() {
    this.deletePaymentDialog().show();
  }
}
