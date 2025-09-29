import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import tailwindConfig from 'tailwind.config';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import { MetricApiService } from '~/domains/metric/metric.api.service';

const colors = tailwindConfig.theme.colors;

const paymentColors = {
  [TransactionStatusEnum.error]: colors.red[500],
  [TransactionStatusEnum.success]: colors.green[500],
  [TransactionStatusEnum.waiting]: colors.yellow[500],
};

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
  readonly aggregateType = input.required<'amount' | 'count'>();

  readonly getLabelFunction =
    input.required<
      (opts: { title: string; labels: string[]; data: number[] }) => string
    >();

  readonly getChartOptions =
    input.required<
      (opts: {
        title: string;
        showLegend: boolean;
        showDataLabels?: boolean;
      }) => unknown
    >();

  readonly title = computed(() =>
    this.aggregateType() === 'amount'
      ? $localize`Amount sent per payment`
      : $localize`Transfers per payment`,
  );

  query = injectQuery(() => ({
    ...this.metricApiService.getAllPaymentsAggregates({
      projectId: this.projectId,
      limitNumberOfPayments: '5',
    })(),
    enabled: !!this.projectId(),
  }));

  readonly queryData = computed(() => {
    if (!this.query.isSuccess()) {
      return {};
    }

    return this.query.data();
  });

  readonly labels = computed<string[]>(() =>
    Object.keys(this.queryData()).sort((a, b) => Number(a) - Number(b)),
  );

  readonly data = computed(() =>
    this.labels().map((k) => this.queryData()[Number(k)]),
  );

  readonly chartOptions = computed(() =>
    this.getChartOptions()({
      title: this.title(),
      showLegend: true,
    }),
  );

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.data().map(
          // TODO: once payments-reporting.services.ts is using enums, use TransactionStatusEnum.error here instead of 'failed'
          (a) => a.failed[this.aggregateType()],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.data().map(
          (a) => a[TransactionStatusEnum.success][this.aggregateType()],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.data().map(
          (a) => a[TransactionStatusEnum.waiting][this.aggregateType()],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  readonly ariaLabel = computed(() =>
    this.getLabelFunction()({
      title: this.title(),
      labels: this.labels(),
      data: this.chartData().datasets[0].data as number[],
    }),
  );
}
