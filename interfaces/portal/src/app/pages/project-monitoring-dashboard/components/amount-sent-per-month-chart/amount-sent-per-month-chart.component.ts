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

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import tailwindConfig from '~/../../tailwind.config';
import { MetricApiService } from '~/domains/metric/metric.api.service';

const colors = tailwindConfig.theme.colors;

const paymentColors = {
  [TransactionStatusEnum.error]: colors.red[500],
  [TransactionStatusEnum.success]: colors.green[500],
  [TransactionStatusEnum.waiting]: colors.yellow[500],
};

@Component({
  selector: 'app-amount-sent-per-month-chart',
  imports: [ChartModule],
  templateUrl: './amount-sent-per-month-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AmountSentPerMonthChartComponent {
  private metricApiService = inject(MetricApiService);
  readonly projectId = input.required<string>();

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

  readonly title = $localize`Amount sent per month`;

  readonly query = injectQuery(() => ({
    ...this.metricApiService.getAmountSentByMonth({
      projectId: this.projectId,
      limitNumberOfPayments: 5,
    })(),
    enabled: !!this.projectId(),
  }));

  readonly queryData = computed(() =>
    this.query.isSuccess() ? this.query.data() : {},
  );

  readonly labels = computed<string[]>(() =>
    // We consciously don't localize the labels here as they are a weird date
    // format.
    Object.keys(this.queryData()).sort(),
  );

  readonly data = computed(() => this.labels().map((k) => this.queryData()[k]));

  readonly chartOptions = computed(() =>
    this.getChartOptions()({
      title: this.title,
      showLegend: true,
    }),
  );

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.data().map((a) => a.failed),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.data().map((a) => a[TransactionStatusEnum.success]),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.data().map((a) => a[TransactionStatusEnum.waiting]),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  readonly ariaLabel = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      labels: this.labels(),
      data: this.chartData().datasets[0].data as number[],
    }),
  );
}
