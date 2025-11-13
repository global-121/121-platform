import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ChartData, ChartDataset } from 'chart.js';
import { ChartModule } from 'primeng/chart';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

import tailwindConfig from '~/../../tailwind.config';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { TRANSACTION_STATUS_LABELS } from '~/domains/transaction/transaction.helper';
import { ChartTextAlternativeOptions } from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.page';

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
    input.required<(opts: ChartTextAlternativeOptions) => string>();

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

  readonly chartDataDatasets = computed(() => {
    const datasets: ChartDataset[] = [];

    const hasValues = (data: number[]) => data.some((value) => value > 0);

    const pendingApproval = this.data().map(
      (aggregate) => aggregate[TransactionStatusEnum.pendingApproval],
    );
    if (hasValues(pendingApproval)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.pendingApproval],
        data: pendingApproval,
        backgroundColor: tailwindConfig.theme.colors.orange[500],
      });
    }

    const approved = this.data().map(
      (aggregate) => aggregate[TransactionStatusEnum.approved],
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
      (aggregate) => aggregate.failed,
    );
    if (hasValues(failed)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.error],
        data: failed,
        backgroundColor: tailwindConfig.theme.colors.red[500],
      });
    }

    const success = this.data().map(
      (aggregate) => aggregate[TransactionStatusEnum.success],
    );
    if (hasValues(success)) {
      datasets.push({
        label: TRANSACTION_STATUS_LABELS[TransactionStatusEnum.success],
        data: success,
        backgroundColor: tailwindConfig.theme.colors.green[500],
      });
    }

    const waiting = this.data().map(
      (aggregate) => aggregate[TransactionStatusEnum.waiting],
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
    datasets: this.chartDataDatasets(),
  }));

  readonly chartTextAlternative = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      primaryLabels: this.labels(),
      datasets: this.chartData().datasets.map((dataset) => ({
        label: dataset.label ?? '',
        data: dataset.data as number[],
      })),
    }),
  );
}
