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
import { ChartData, ChartDataset } from 'chart.js';
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

  readonly chartDatasets = computed(() => {
    const datasets: ChartDataset[] = [];

    const hasValues = (data: number[]) => data.some((value) => value > 0);

    const pendingApproval = this.data().map(
      (payment) =>
        payment[TransactionStatusEnum.pendingApproval][this.aggregateType()],
    );
    if (hasValues(pendingApproval)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.pendingApproval],
        data: pendingApproval,
        backgroundColor: tailwindConfig.theme.colors.orange[500],
      });
    }

    const approved = this.data().map(
      (payment) =>
        payment[TransactionStatusEnum.approved][this.aggregateType()],
    );
    if (hasValues(approved)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.approved],
        data: approved,
        backgroundColor: tailwindConfig.theme.colors.purple[500],
      });
    }

    const failed = this.data().map(
      // TODO: once payments-reporting.services.ts is using enums, use TransactionStatusEnum.error here instead of 'failed'
      (payment) => payment.failed[this.aggregateType()],
    );
    if (hasValues(failed)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.error],
        data: failed,
        backgroundColor: tailwindConfig.theme.colors.red[500],
      });
    }

    const success = this.data().map(
      (payment) => payment[TransactionStatusEnum.success][this.aggregateType()],
    );
    if (hasValues(success)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.success],
        data: success,
        backgroundColor: tailwindConfig.theme.colors.green[500],
      });
    }

    const waiting = this.data().map(
      (payment) => payment[TransactionStatusEnum.waiting][this.aggregateType()],
    );
    if (hasValues(waiting)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.waiting],
        data: waiting,
        backgroundColor: tailwindConfig.theme.colors.yellow[500],
      });
    }

    return datasets;
  });

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labels(),
    datasets: this.chartDatasets(),
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
