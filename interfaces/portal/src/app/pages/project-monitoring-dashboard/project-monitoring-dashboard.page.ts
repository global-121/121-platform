import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ChartData } from 'chart.js';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { PaymentsAggregateChartComponent } from '~/pages/project-monitoring-dashboard/components/payments-aggregate-chart/payments-aggregate-chart.component';
import { RegistrationsByCreationDateChartComponent } from '~/pages/project-monitoring-dashboard/components/registrations-by-creation-date-chart/registrations-by-creation-date-chart.component';
import { RegistrationsPerDuplicateStatusComponentChart } from '~/pages/project-monitoring-dashboard/components/registrations-per-duplicate-status-chart/registrations-per-duplicate-status-chart.component';
import { RegistrationsPerStatusChartComponent } from '~/pages/project-monitoring-dashboard/components/registrations-per-status-chart/registrations-per-status-chart.component';
import {
  getChartOptions,
  paymentColors,
} from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.helper';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-project-monitoring-dashboard',
  templateUrl: './project-monitoring-dashboard.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageLayoutMonitoringComponent,
    ChartModule,
    CardModule,
    RegistrationsPerStatusChartComponent,
    RegistrationsPerDuplicateStatusComponentChart,
    RegistrationsByCreationDateChartComponent,
    PaymentsAggregateChartComponent,
  ],
})
export class ProjectMonitoringDashboardPageComponent {
  private metricApiService = inject(MetricApiService);
  private translatableStringService = inject(TranslatableStringService);

  readonly projectId = input.required<string>();

  getTranslatedAriaLabel = ({
    title,
    labels,
    data,
  }: {
    title: string;
    labels: string[];
    data: number[];
  }) =>
    // XXX: finish comment: The reason for having an aria label....
    // XXX: Each chart should have the correct title, also in the aria label.
    `${title}. ` +
    this.translatableStringService.commaSeparatedList(
      labels.map((label, index) => `${label}: ${String(data[index])}`),
    );

  // XXX: not make this a signal
  readonly limitNumberOfPayments = signal('5');

  amountSentPerMonth = injectQuery(() => ({
    ...this.metricApiService.getAmountSentByMonth({
      projectId: this.projectId,
      limitNumberOfPayments: this.limitNumberOfPayments(),
    })(),
    enabled: !!this.projectId(),
  }));

  readonly amountSentPerMonthLabelsAndData = computed(() => {
    if (!this.amountSentPerMonth.isSuccess()) {
      return { labels: [], data: [] };
    }
    const queryData = this.amountSentPerMonth.data();
    const labels = Object.keys(queryData).sort();
    const data = labels.map((k) => queryData[k]);
    return { labels, data };
  });

  amountSentPerMonthChartOptions = getChartOptions({
    title: $localize`Amount sent per month`,
    showLegend: true,
  });

  readonly amountSentPerMonthChartData = computed<ChartData>(() => ({
    labels: this.amountSentPerMonthLabelsAndData().labels,
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.amountSentPerMonthLabelsAndData().data.map((a) => a.failed),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.amountSentPerMonthLabelsAndData().data.map(
          (a) => a[TransactionStatusEnum.success],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.amountSentPerMonthLabelsAndData().data.map(
          (a) => a[TransactionStatusEnum.waiting],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  readonly amountSentPerMonthAriaLabel = computed(() =>
    this.getTranslatedAriaLabel({
      title: $localize`Amount sent per month`,
      labels: this.amountSentPerMonthLabelsAndData().labels,
      data: this.amountSentPerMonthChartData().datasets[0].data as number[],
    }),
  );
}
