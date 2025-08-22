import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  signal,
  Signal,
} from '@angular/core';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MetricApiService } from '~/domains/metric/metric.api.service';

import tailwindConfig from '~/../../tailwind.config';
import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';

@Component({
  selector: 'app-project-monitoring-dashboard',
  templateUrl: './project-monitoring-dashboard.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PageLayoutMonitoringComponent, ChartModule, CardModule],
})
export class ProjectMonitoringDashboardPageComponent {
  private metricApiService = inject(MetricApiService);
  private registrationApiService = inject(RegistrationApiService);

  readonly projectId = input.required<string>();

  private getLabels = (queryResult) =>
    computed<string[]>(() => {
      if (!queryResult.isSuccess()) {
        return [];
      }

      return Object.keys(queryResult.data()).sort();
    });

  private getData = (queryResult, labels: Signal<string[]>) =>
    computed(() => {
      if (!queryResult.isSuccess() || !labels()) {
        return [];
      }

      const data = queryResult.data();

      return labels().map((k) => data[k]) || [];
    });

  private backgroundColor = [
    tailwindConfig.theme.colors.green[100],
    tailwindConfig.theme.colors.red[100],
    tailwindConfig.theme.colors.yellow[100],
    tailwindConfig.theme.colors.blue[100],
    tailwindConfig.theme.colors.grey[100],
  ];

  registrationStatuses = injectQuery(() => ({
    ...this.metricApiService.getRegistrationCountByStatus({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  registrationStatusData = computed<ChartData>(() => ({
    labels: this.registrationStatuses.data()?.map((s) => s.status) || [],
    datasets: [
      {
        data: this.registrationStatuses.data()?.map((s) => s.statusCount) || [],
        backgroundColor: this.backgroundColor,
      },
    ],
  }));

  duplicates = injectQuery(() => ({
    ...this.registrationApiService.getManyByQuery(
      this.projectId,
      signal({ filter: { duplicateStatus: DuplicateStatus.duplicate } }),
    )(),
    enabled: !!this.projectId(),
  }));

  uniques = injectQuery(() => ({
    ...this.registrationApiService.getManyByQuery(
      this.projectId,
      signal({ filter: { duplicateStatus: DuplicateStatus.unique } }),
    )(),
    enabled: !!this.projectId(),
  }));

  duplicationData = computed<ChartData>(() => ({
    labels: [DuplicateStatus.duplicate, DuplicateStatus.unique],
    datasets: [
      {
        data: [
          this.duplicates.data()?.meta.totalItems ?? 0,
          this.uniques.data()?.meta.totalItems ?? 0,
        ],
        backgroundColor: this.backgroundColor,
      },
    ],
  }));

  registrationCountByDate = injectQuery(() => ({
    ...this.metricApiService.getRegistrationCountByDate({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  registrationsByDateLabels = this.getLabels(this.registrationCountByDate);

  registrationsByDateData = this.getData(
    this.registrationCountByDate,
    this.registrationsByDateLabels,
  );

  registrationsByDate = computed<ChartData>(() => ({
    labels: this.registrationsByDateLabels(),
    datasets: [
      {
        data: this.registrationsByDateData(),
        backgroundColor: this.backgroundColor,
      },
    ],
    xAxes: [
      {
        type: 'time',
        position: 'bottom',
        time: {
          displayFormats: { day: 'MM/YY' },
          tooltipFormat: 'DD/MM/YY',
          unit: 'month',
        },
      },
    ],
  }));

  aggregatePerPayment = injectQuery(() => ({
    ...this.metricApiService.getAllPaymentsAggregates({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  aggregatePerPaymentLabels = this.getLabels(this.aggregatePerPayment);

  aggregatePerPaymentData = this.getData(
    this.aggregatePerPayment,
    this.aggregatePerPaymentLabels,
  );

  transfersPerPayment = computed<ChartData>(() => ({
    labels: this.aggregatePerPaymentLabels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.aggregatePerPaymentData().map((a) => a['failed'].count),
        backgroundColor: this.backgroundColor,
      },
      {
        label: TransactionStatusEnum.success,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.success].count,
        ),
        backgroundColor: this.backgroundColor,
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.waiting].count,
        ),
        backgroundColor: this.backgroundColor,
      },
    ],
  }));

  amountSentPerPayment = computed<ChartData>(() => ({
    labels: this.aggregatePerPaymentLabels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.aggregatePerPaymentData().map((a) => a['failed'].amount),
        backgroundColor: this.backgroundColor,
      },
      {
        label: TransactionStatusEnum.success,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.success].amount,
        ),
        backgroundColor: this.backgroundColor,
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.waiting].amount,
        ),
        backgroundColor: this.backgroundColor,
      },
    ],
  }));

  amountSentPerMonth = injectQuery(() => ({
    ...this.metricApiService.getAmountSentByMonth({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  amountSentPerMonthLabels = this.getLabels(this.amountSentPerMonth);

  amountSentPerMonthData = this.getData(
    this.amountSentPerMonth,
    this.amountSentPerMonthLabels,
  );

  amountSentPerMonthChartData = computed<ChartData>(() => ({
    labels: this.amountSentPerMonthLabels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.amountSentPerMonthData().map((a) => a['failed']),
        backgroundColor: this.backgroundColor,
      },
      {
        label: TransactionStatusEnum.success,
        data: this.amountSentPerMonthData().map(
          (a) => a[TransactionStatusEnum.success],
        ),
        backgroundColor: this.backgroundColor,
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.amountSentPerMonthData().map(
          (a) => a[TransactionStatusEnum.waiting],
        ),
        backgroundColor: this.backgroundColor,
      },
    ],
  }));

  commonChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Chart.js Pie Chart',
      },
    },
  };

  barOptions = { ...this.commonChartOptions };
  pieOptions = { ...this.commonChartOptions };
  lineOptions = { ...this.commonChartOptions };
}
