import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { AppRoutes } from '~/app.routes';
import { CardSummaryMetricsContainerComponent } from '~/components/card-summary-metrics-container/card-summary-metrics-container.component';
import { CardWithLinkComponent } from '~/components/card-with-link/card-with-link.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentApiService } from '~/domains/payment/payment.api.service';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-program-summary-card',
  imports: [
    TranslatableStringPipe,
    CommonModule,
    SkeletonInlineComponent,
    CardWithLinkComponent,
    CardSummaryMetricsContainerComponent,
  ],
  providers: [CurrencyPipe, DecimalPipe],
  templateUrl: './program-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSummaryCardComponent {
  private metricApiService = inject(MetricApiService);
  private programApiService = inject(ProgramApiService);
  private paymentApiService = inject(PaymentApiService);
  private currencyPipe = inject(CurrencyPipe);
  private decimalPipe = inject(DecimalPipe);

  public readonly id = input.required<number>();

  public program = injectQuery(this.programApiService.getProgram(this.id));
  public metrics = injectQuery(() => ({
    ...this.metricApiService.getProgramSummaryMetrics(this.id)(),
    enabled: !!this.program.data()?.id,
  }));
  public payments = injectQuery(() => ({
    ...this.paymentApiService.getPaymentAggregationsSummaries(this.id)(),
    enabled: !!this.program.data()?.id,
  }));
  programLink = (programId: number) => ['/', AppRoutes.program, programId];

  public readonly getLastPayment = computed(() => {
    const data = this.payments.data();
    if (!data) {
      return;
    }
    return data.sort((a, b) => (a.paymentId < b.paymentId ? 1 : -1))[0];
  });

  public readonly summaryMetrics = computed(() => {
    if (
      this.metrics.isPending() ||
      this.program.isPending() ||
      !this.metrics.data()
    ) {
      return [];
    }

    return [
      {
        value: this.decimalPipe.transform(this.metrics.data()?.targetedPeople),
        label: $localize`Target registrations`,
      },
      {
        value: this.decimalPipe.transform(this.metrics.data()?.includedPeople),
        label: $localize`Included registrations`,
      },
      {
        value: this.currencyPipe.transform(
          this.metrics.data()?.totalBudget,
          this.program.data()?.currency,
          'symbol-narrow',
          '1.0-0',
        ),
        label: $localize`Budget`,
      },
      {
        value: this.currencyPipe.transform(
          this.metrics.data()?.cashDisbursed,
          this.program.data()?.currency,
          'symbol-narrow',
          '1.0-0',
        ),
        label: $localize`Cash disbursed`,
      },
    ];
  });
}
