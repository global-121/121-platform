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

import { AppRoutes } from '~/app.routes';
import { CardSummaryMetricsContainerComponent } from '~/components/card-summary-metrics-container/card-summary-metrics-container.component';
import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { Locale } from '~/utils/locale';

@Component({
  selector: 'app-payment-summary-card',
  standalone: true,
  imports: [
    SkeletonInlineComponent,
    ColoredChipComponent,
    CardWithLinkComponent,
    CardSummaryMetricsContainerComponent,
  ],
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

  projectId = input.required<string>();
  paymentId = input.required<number>();
  paymentDate = input.required<string>();
  cardIndex = input.required<number>();

  paymentStatus = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );
  metrics = injectQuery(() => ({
    ...this.paymentApiService.getPayment(this.projectId, this.paymentId)(),
    // Refetch the data every second if this is the latest payment, and a payment is in progress
    refetchInterval:
      this.isLatestPayment() &&
      (this.paymentStatus.isPending() || this.paymentStatus.data()?.inProgress)
        ? 1000
        : undefined,
  }));

  isLatestPayment = computed(() => this.cardIndex() === 0);

  includedRegistrations = computed(() => {
    const successCount = this.metrics.data()?.success.count ?? 0;
    const waitingCount = this.metrics.data()?.waiting.count ?? 0;
    const failedCount = this.metrics.data()?.failed.count ?? 0;

    return successCount + waitingCount + failedCount;
  });

  expectedAmount = computed(() => {
    const successAmount = this.metrics.data()?.success.amount ?? 0;
    const waitingAmount = this.metrics.data()?.waiting.amount ?? 0;
    const failedAmount = this.metrics.data()?.failed.amount ?? 0;

    return successAmount + waitingAmount + failedAmount;
  });

  showFailedAlert = computed(
    () => (this.metrics.data()?.failed.count ?? 0) > 0,
  );

  successAmount = computed(() => this.metrics.data()?.success.amount ?? 0);

  paymentInProgress = injectQuery(
    this.paymentApiService.getPaymentStatus(this.projectId),
  );

  paymentLink = (projectId: number | string, paymentId: number | string) => [
    '/',
    AppRoutes.project,
    projectId,
    AppRoutes.projectPayments,
    paymentId,
  ];

  public project = injectQuery(
    this.projectApiService.getProject(this.projectId),
  );

  paymentTitle = computed(
    () =>
      $localize`:@@page-title-project-payment:Payment` +
      ' ' +
      (new DatePipe(this.locale).transform(this.paymentDate(), 'short') ?? ''),
  );

  public summaryMetrics = computed(() => {
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
          this.project.data()?.currency ?? 'EUR',
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
          this.project.data()?.currency ?? 'EUR',
          'symbol-narrow',
          '1.2-2',
        ),
        label: $localize`Amount successfully sent`,
      },
    ];
  });
}
