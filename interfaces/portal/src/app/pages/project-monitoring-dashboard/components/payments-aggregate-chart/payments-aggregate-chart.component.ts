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
import { ChartModule } from 'primeng/chart';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import { MetricApiService } from '~/domains/metric/metric.api.service';
import { ProjectAggregatePerPaymentValue } from '~/domains/metric/metric.model';
import {
  getChartOptions,
  paymentColors,
} from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.helper';

@Component({
  selector: 'app-payments-aggregate-chart',
  imports: [ChartModule],

  templateUrl: './payments-aggregate-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsAggregateChartComponent {
  // This component can show a chart for either the amount or count of payments.
  private metricApiService = inject(MetricApiService);
  readonly projectId = input.required<string>();
  readonly aggregateType = input<'amount' | 'count'>();

  readonly getLabelFunction =
    input.required<
      (opts: { title: string; labels: string[]; data: number[] }) => string
    >();

  readonly title = computed(() =>
    this.aggregateType() === 'amount'
      ? $localize`Amount sent per payment`
      : $localize`Transfers per payment`,
  );

  // XXX: not make this a signal
  readonly limitNumberOfPayments = signal('5');

  aggregatePerPayment = injectQuery(() => ({
    ...this.metricApiService.getAllPaymentsAggregates({
      projectId: this.projectId,
      limitNumberOfPayments: this.limitNumberOfPayments(),
    })(),
    enabled: !!this.projectId(),
  }));

  readonly labelsAndData = computed(() => {
    if (!this.aggregatePerPayment.isSuccess()) {
      return { labels: [], data: [] };
    }
    const queryData: Record<string, ProjectAggregatePerPaymentValue> =
      this.aggregatePerPayment.data();
    const labels = Object.keys(queryData).sort((a, b) => Number(a) - Number(b));
    const data = labels.map((k) => queryData[k]);
    return { labels, data };
  });

  chartOptions = getChartOptions({
    title: this.title(),
    showLegend: true,
  });

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labelsAndData().labels,
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.labelsAndData().data.map(
          // TODO: once payments-reporting.services.ts is using enums, use TransactionStatusEnum.error here instead of 'failed'
          (a) => a.failed[this.aggregateType()],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.labelsAndData().data.map(
          (a) => a[TransactionStatusEnum.success][this.aggregateType()],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.labelsAndData().data.map(
          (a) => a[TransactionStatusEnum.waiting][this.aggregateType()],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  readonly ariaLabel = computed(() =>
    this.getLabelFunction()({
      title: $localize`Transfers per payment`,
      labels: this.labelsAndData().labels,
      data: this.chartData().datasets[0].data as number[],
    }),
  );
}
