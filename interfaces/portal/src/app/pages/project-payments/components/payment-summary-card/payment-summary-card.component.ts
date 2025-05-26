import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { CardSummaryMetricsContainerComponent } from '~/components/card-summary-metrics-container/card-summary-metrics-container.component';
import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { paymentLink } from '~/domains/payment/payment.helpers';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-payment-summary-card',
  imports: [CardWithLinkComponent, CardSummaryMetricsContainerComponent],
  providers: [CurrencyPipe, DecimalPipe],
  templateUrl: './payment-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSummaryCardComponent {
  private locale = inject<Locale>(LOCALE_ID);
  private paymentApiService = inject(PaymentApiService);
  private currencyPipe = inject(CurrencyPipe);
  private decimalPipe = inject(DecimalPipe);
  private projectApiService = inject(ProjectApiService);

  readonly projectId = input.required<string>();
  readonly paymentId = input.required<number>();
  readonly paymentDate = input.required<string>();
  readonly cardIndex = input.required<number>();

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );
  metrics = injectQuery(() => ({
    ...this.paymentApiService.getPayment({
      projectId: this.projectId,
      paymentId: this.paymentId,
    })(),
    // Refetch the data every second if this is the latest payment, and a payment is in progress
    refetchInterval:
      this.isLatestPayment() &&
      (this.paymentStatus.isPending() || this.paymentStatus.data()?.inProgress)
        ? 1000
        : undefined,
  }));

  readonly isLatestPayment = computed(() => this.cardIndex() === 0);

  readonly includedRegistrations = computed(() => {
    const successCount = this.metrics.data()?.success.count ?? 0;
    const waitingCount = this.metrics.data()?.waiting.count ?? 0;
    const failedCount = this.metrics.data()?.failed.count ?? 0;

    return successCount + waitingCount + failedCount;
  });

  readonly expectedAmount = computed(() => {
    const successAmount = this.metrics.data()?.success.amount ?? 0;
    const waitingAmount = this.metrics.data()?.waiting.amount ?? 0;
    const failedAmount = this.metrics.data()?.failed.amount ?? 0;

    return successAmount + waitingAmount + failedAmount;
  });

  readonly showFailedAlert = computed(
    () => (this.metrics.data()?.failed.count ?? 0) > 0,
  );

  readonly successAmount = computed(
    () => this.metrics.data()?.success.amount ?? 0,
  );

  readonly paymentLink = computed(() =>
    paymentLink({ projectId: this.projectId(), paymentId: this.paymentId() }),
  );

  readonly paymentTitle = computed(
    () =>
      $localize`:@@page-title-project-payment:Payment` +
      ' ' +
      (new DatePipe(this.locale).transform(this.paymentDate(), 'short') ?? ''),
  );

  public readonly summaryMetrics = computed(() => {
    if (this.metrics.isPending() || !this.metrics.data()) {
      return [];
    }

    return [
      {
        value: this.decimalPipe.transform(this.includedRegistrations()),
        label: $localize`Included reg.`,
      },
      {
        value: this.currencyPipe.transform(
          this.expectedAmount(),
          this.project.data()?.currency,
          'symbol-narrow',
          '1.2-2',
        ),
        label: $localize`Expected total amount`,
      },
      {
        value: this.decimalPipe.transform(this.metrics.data()?.failed.count),
        label: $localize`Failed transfers`,
        showAlert: this.showFailedAlert(),
      },
      {
        value: this.currencyPipe.transform(
          this.successAmount(),
          this.project.data()?.currency,
          'symbol-narrow',
          '1.2-2',
        ),
        label: $localize`Amount successfully sent`,
      },
    ];
  });
}
