import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PaymentSummaryCardComponent } from '~/pages/project-payments/components/payment-summary-card/payment-summary-card.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-payments',
  standalone: true,
  imports: [PageLayoutComponent, PaymentSummaryCardComponent, ButtonModule],
  providers: [ToastService],
  templateUrl: './project-payments.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsPageComponent {
  private paymentService = inject(PaymentApiService);

  // this is injected by the router
  projectId = input.required<number>();

  private toastService = inject(ToastService);

  onCreatePayment() {
    this.toastService.showToast({
      severity: 'warn',
      detail: 'Functionality not implemented yet',
    });
  }
  private paymentsQuery = injectQuery(
    this.paymentService.getPayments(this.projectId),
  );

  payments = computed(() =>
    this.paymentsQuery.data()?.sort((a, b) => b.payment - a.payment),
  );

  paymentStatus = injectQuery(
    this.paymentService.getPaymentStatus(this.projectId),
  );
}
