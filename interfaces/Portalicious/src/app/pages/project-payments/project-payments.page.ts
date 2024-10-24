import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { PaymentSummaryCardComponent } from '~/pages/project-payments/components/payment-summary-card/payment-summary-card.component';

@Component({
  selector: 'app-project-payments',
  standalone: true,
  imports: [PageLayoutComponent, PaymentSummaryCardComponent],
  templateUrl: './project-payments.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPaymentsPageComponent {
  private paymentService = inject(PaymentApiService);

  // this is injected by the router
  projectId = input.required<number>();

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
