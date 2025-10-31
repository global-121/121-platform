import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import tailwindConfig from 'tailwind.config';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import { MetricApiService } from '~/domains/metric/metric.api.service';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';
import { ChartTextAlternativeOptions } from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.page';

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
  readonly locale = inject(LOCALE_ID);
  readonly projectId = input.required<string>();
  readonly aggregateType = input.required<'count' | 'transferValue'>();

  readonly getLabelFunction =
    input.required<(opts: ChartTextAlternativeOptions) => string>();

  readonly getChartOptions =
    input.required<
      (opts: {
        title: string;
        showLegend: boolean;
        showDataLabels?: boolean;
      }) => unknown
    >();

  readonly title = computed(() =>
    this.aggregateType() === 'transferValue'
      ? $localize`Amount sent per payment`
      : $localize`Transfers per payment`,
  );

  query = injectQuery(() => ({
    // Sorting by date happens on the backend.
    ...this.metricApiService.getAllPaymentsAggregates({
      projectId: this.projectId,
      limitNumberOfPayments: '5',
    })(),
    enabled: !!this.projectId(),
  }));

  readonly queryData = computed(() =>
    this.query.isSuccess() ? this.query.data() : [],
  );

  readonly labels = computed<string[]>(() => {
    const dates = this.queryData().map((payment) => payment.date);

    return dates.map(
      (date) => new DatePipe(this.locale).transform(date, 'shortDate') ?? '',
    );
  });

  readonly data = computed(() =>
    this.queryData().map((payment) => payment.aggregatedStatuses),
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
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.error],
        data: this.data().map(
          // TODO: once payments-reporting.services.ts is using enums, use TransactionStatusEnum.error here instead of 'failed'
          (payment) => payment.failed[this.aggregateType()],
        ),
        backgroundColor: tailwindConfig.theme.colors.red[500],
      },
      {
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.success],
        data: this.data().map(
          (payment) =>
            payment[TransactionStatusEnum.success][this.aggregateType()],
        ),
        backgroundColor: tailwindConfig.theme.colors.green[500],
      },
      {
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.waiting],
        data: this.data().map(
          (payment) =>
            payment[TransactionStatusEnum.waiting][this.aggregateType()],
        ),
        backgroundColor: tailwindConfig.theme.colors.yellow[500],
      },
      {
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.created],
        data: this.data().map(
          (payment) =>
            payment[TransactionStatusEnum.created][this.aggregateType()],
        ),
        backgroundColor: tailwindConfig.theme.colors.grey[500],
      },
    ],
  }));

  readonly chartTextAlternative = computed(() =>
    this.getLabelFunction()({
      title: this.title(),
      primaryLabels: this.labels(),
      datasets: this.chartData().datasets.map((dataset) => ({
        label: dataset.label ?? '',
        data: dataset.data as number[],
      })),
    }),
  );
}
