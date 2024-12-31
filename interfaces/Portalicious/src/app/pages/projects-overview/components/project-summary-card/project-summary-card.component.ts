import { CommonModule, CurrencyPipe } from '@angular/common';
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
import { ProjectApiService } from '~/domains/project/project.api.service';
import { TranslatableStringPipe } from '~/pipes/translatable-string.pipe';

@Component({
  selector: 'app-project-summary-card',
  imports: [
    TranslatableStringPipe,
    CommonModule,
    SkeletonInlineComponent,
    CardWithLinkComponent,
    CardSummaryMetricsContainerComponent,
  ],
  providers: [CurrencyPipe],
  templateUrl: './project-summary-card.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSummaryCardComponent {
  private metricApiService = inject(MetricApiService);
  private projectApiService = inject(ProjectApiService);
  private paymentApiService = inject(PaymentApiService);
  private currencyPipe = inject(CurrencyPipe);

  public id = input.required<number>();

  public project = injectQuery(this.projectApiService.getProject(this.id));
  public metrics = injectQuery(() => ({
    ...this.metricApiService.getProjectSummaryMetrics(this.id)(),
    enabled: !!this.project.data()?.id,
  }));
  public payments = injectQuery(() => ({
    ...this.paymentApiService.getPayments(this.id)(),
    enabled: !!this.project.data()?.id,
  }));
  projectLink = (projectId: number) => ['/', AppRoutes.project, projectId];

  public getLastPayment = computed(() => {
    const data = this.payments.data();
    if (!data) {
      return;
    }
    return data.sort((a, b) => (a.payment < b.payment ? 1 : -1))[0];
  });

  public summaryMetrics = computed(() => {
    if (
      this.metrics.isPending() ||
      this.project.isPending() ||
      !this.metrics.data()
    ) {
      return [];
    }

    return [
      {
        value: this.metrics.data()?.targetedPeople,
        label: $localize`Target registrations`,
      },
      {
        value: this.metrics.data()?.includedPeople,
        label: $localize`Included registrations`,
      },
      {
        value: this.currencyPipe.transform(
          this.metrics.data()?.totalBudget,
          this.project.data()?.currency ?? 'EUR',
          'symbol-narrow',
          '1.0-0',
        ),
        label: $localize`Budget`,
      },
      {
        value: this.currencyPipe.transform(
          this.metrics.data()?.spentMoney,
          this.project.data()?.currency ?? 'EUR',
          'symbol-narrow',
          '1.0-0',
        ),
        label: $localize`Cash disbursed`,
      },
    ];
  });
}
