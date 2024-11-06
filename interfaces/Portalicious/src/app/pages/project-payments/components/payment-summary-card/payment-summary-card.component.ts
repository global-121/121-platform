import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { AppRoutes } from '~/app.routes';
import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { MetricContainerComponent } from '~/components/metric-container/metric-container.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-payment-summary-card',
  standalone: true,
  imports: [
    TranslatableStringPipe,
    CommonModule,
    CurrencyPipe,
    MetricContainerComponent,
    SkeletonInlineComponent,
    ColoredChipComponent,
    CardWithLinkComponent,
  ],
  templateUrl: './payment-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSummaryCardComponent {
  private locale = inject<Locale>(LOCALE_ID);
  private paymentApiService = inject(PaymentApiService);

  projectId = input.required<number>();
  paymentId = input.required<number>();
  paymentDate = input.required<string>();
  cardIndex = input.required<number>();

  metrics = injectQuery(
    this.paymentApiService.getPayment(this.projectId, this.paymentId),
  );

  includedRegistrations = computed(() => {
    const successCount = this.metrics.data()?.success.count ?? 0;
    const waitingCount = this.metrics.data()?.waiting.count ?? 0;
    const failedCount = this.metrics.data()?.failed.count ?? 0;

    return successCount + waitingCount + failedCount;
  });

  totalAmount = computed(() => {
    const successAmount = this.metrics.data()?.success.amount ?? 0;
    const waitingAmount = this.metrics.data()?.waiting.amount ?? 0;
    const failedAmount = this.metrics.data()?.failed.amount ?? 0;

    return successAmount + waitingAmount + failedAmount;
  });

  showFailedAlert = computed(
    () => (this.metrics.data()?.failed.count ?? 0) > 0,
  );

  paymentInProgress = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  paymentLink = (projectId: number, paymentId: number) => [
    '/',
    AppRoutes.project,
    projectId,
    AppRoutes.projectPayments,
    paymentId,
  ];

  paymentTitle = computed(
    () =>
      $localize`:@@page-title-project-payment:Payment` +
      ' ' +
      (new DatePipe(this.locale).transform(this.paymentDate(), 'short') ?? ''),
  );
}
