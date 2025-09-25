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
import { ProjectAggregatePerPaymentValue } from '~/domains/metric/metric.model';
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

  readonly limitNumberOfPayments = signal('5');

  aggregatePerPayment = injectQuery(() => ({
    ...this.metricApiService.getAllPaymentsAggregates({
      projectId: this.projectId,
      limitNumberOfPayments: this.limitNumberOfPayments(),
    })(),
    enabled: !!this.projectId(),
  }));

  readonly aggregatePerPaymentLabelsAndData = computed(() => {
    if (!this.aggregatePerPayment.isSuccess()) {
      return { labels: [], data: [] };
    }
    const queryData: Record<string, ProjectAggregatePerPaymentValue> =
      this.aggregatePerPayment.data();
    const labels = Object.keys(queryData).sort((a, b) => Number(a) - Number(b));
    const data = labels.map((k) => queryData[k]);
    return { labels, data };
  });

  transfersPerPaymentChartOptions = getChartOptions({
    title: $localize`Transfers per payment`,
    showLegend: true,
  });

  readonly transfersPerPaymentChartData = computed<ChartData>(() => ({
    labels: this.aggregatePerPaymentLabelsAndData().labels,
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.aggregatePerPaymentLabelsAndData().data.map(
          // TODO: once payments-reporting.services.ts is using enums, use TransactionStatusEnum.error here instead of 'failed'
          (a) => a.failed.count,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.aggregatePerPaymentLabelsAndData().data.map(
          (a) => a[TransactionStatusEnum.success].count,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.aggregatePerPaymentLabelsAndData().data.map(
          (a) => a[TransactionStatusEnum.waiting].count,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  readonly transfersPerPaymentAriaLabel = computed(() =>
    this.getTranslatedAriaLabel({
      title: $localize`Transfers per payment`,
      labels: this.aggregatePerPaymentLabelsAndData().labels,
      data: this.transfersPerPaymentChartData().datasets[0].data as number[],
    }),
  );

  amountSentPerPaymentChartOptions = getChartOptions({
    title: $localize`Amount sent per payment`,
    showLegend: true,
  });

  readonly amountSentPerPaymentChartData = computed<ChartData>(() => ({
    labels: this.aggregatePerPaymentLabelsAndData().labels,
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.aggregatePerPaymentLabelsAndData().data.map(
          (a) => a.failed.amount,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.aggregatePerPaymentLabelsAndData().data.map(
          (a) => a[TransactionStatusEnum.success].amount,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.aggregatePerPaymentLabelsAndData().data.map(
          (a) => a[TransactionStatusEnum.waiting].amount,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  readonly amountSentPerPaymentAriaLabel = computed(() =>
    this.getTranslatedAriaLabel({
      title: $localize`Amount sent per payment`,
      labels: this.aggregatePerPaymentLabelsAndData().labels,
      data: this.amountSentPerPaymentChartData().datasets[0].data as number[],
    }),
  );

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
    title: $localize`Amount Sent per month`,
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
      title: $localize`Amount Sent per month`,
      labels: this.amountSentPerMonthLabelsAndData().labels,
      data: this.amountSentPerMonthChartData().datasets[0].data as number[],
    }),
  );
}
