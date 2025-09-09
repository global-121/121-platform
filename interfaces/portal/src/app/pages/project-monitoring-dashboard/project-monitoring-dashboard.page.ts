import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ChartData } from 'chart.js';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MetricApiService } from '~/domains/metric/metric.api.service';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import {
  duplicationColors,
  getChartOptions,
  getData,
  getLabels,
  paymentColors,
  registrationsByDateColor,
  registrationsPerStatusColors,
} from './project-monitoring-dashboard.helper';

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

  chartOptions = getChartOptions;

  registrationsPerStatus = injectQuery(() => ({
    ...this.metricApiService.getRegistrationCountByStatus({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  registrationsPerStatusLabels = getLabels(this.registrationsPerStatus);

  registrationsPerStatusData = getData(
    this.registrationsPerStatus,
    this.registrationsPerStatusLabels,
  );

  registrationsPerStatusChartColors = computed(
    () =>
      this.registrationsPerStatusLabels().map(
        (l) => registrationsPerStatusColors[l],
      ) || [],
  );

  registrationsPerStatusChartData = computed<ChartData>(() => ({
    labels: this.registrationsPerStatusLabels(),
    datasets: [
      {
        data: this.registrationsPerStatusData(),
        backgroundColor: this.registrationsPerStatusChartColors(),
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

  duplicationLabels = signal([
    DuplicateStatus.duplicate,
    DuplicateStatus.unique,
  ]);

  duplicationChartColors = computed(
    () => this.duplicationLabels().map((l) => duplicationColors[l]) || [],
  );

  duplicationChartData = computed<ChartData>(() => ({
    labels: [DuplicateStatus.duplicate, DuplicateStatus.unique],
    datasets: [
      {
        data: [
          this.duplicates.data()?.meta.totalItems ?? 0,
          this.uniques.data()?.meta.totalItems ?? 0,
        ],
        backgroundColor: this.duplicationChartColors(),
      },
    ],
  }));

  registrationCountByDate = injectQuery(() => ({
    ...this.metricApiService.getRegistrationCountByDate({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  registrationsByDateLabels = getLabels(this.registrationCountByDate);

  registrationsByDateAxisLabels = computed(() => {
    if (!this.registrationsByDateLabels()) {
      return [];
    }

    return this.registrationsByDateLabels().map((l) => {
      const date = new Date(l);

      if (date.getDate() !== 1) {
        return '';
      }

      return date.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
    });
  });

  registrationsByDateData = getData(
    this.registrationCountByDate,
    this.registrationsByDateLabels,
  );

  registrationsByDateChartData = computed<ChartData>(() => ({
    labels: this.registrationsByDateLabels(),
    xLabels: this.registrationsByDateAxisLabels(),
    datasets: [
      {
        data: this.registrationsByDateData(),
        backgroundColor: registrationsByDateColor,
      },
    ],
  }));

  aggregatePerPayment = injectQuery(() => ({
    ...this.metricApiService.getAllPaymentsAggregates({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  aggregatePerPaymentLabels = getLabels(this.aggregatePerPayment);

  aggregatePerPaymentData = getData(
    this.aggregatePerPayment,
    this.aggregatePerPaymentLabels,
  );

  transfersPerPaymentChartData = computed<ChartData>(() => ({
    labels: this.aggregatePerPaymentLabels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.aggregatePerPaymentData().map((a) => a['failed'].count),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.success].count,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.waiting].count,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  amountSentPerPaymentChartData = computed<ChartData>(() => ({
    labels: this.aggregatePerPaymentLabels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.aggregatePerPaymentData().map((a) => a['failed'].amount),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.success].amount,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.aggregatePerPaymentData().map(
          (a) => a[TransactionStatusEnum.waiting].amount,
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));

  amountSentPerMonth = injectQuery(() => ({
    ...this.metricApiService.getAmountSentByMonth({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  amountSentPerMonthLabels = getLabels(this.amountSentPerMonth);

  amountSentPerMonthData = getData(
    this.amountSentPerMonth,
    this.amountSentPerMonthLabels,
  );

  amountSentPerMonthChartData = computed<ChartData>(() => ({
    labels: this.amountSentPerMonthLabels(),
    datasets: [
      {
        label: TransactionStatusEnum.error,
        data: this.amountSentPerMonthData().map((a) => a['failed']),
        backgroundColor: paymentColors[TransactionStatusEnum.error],
      },
      {
        label: TransactionStatusEnum.success,
        data: this.amountSentPerMonthData().map(
          (a) => a[TransactionStatusEnum.success],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.success],
      },
      {
        label: TransactionStatusEnum.waiting,
        data: this.amountSentPerMonthData().map(
          (a) => a[TransactionStatusEnum.waiting],
        ),
        backgroundColor: paymentColors[TransactionStatusEnum.waiting],
      },
    ],
  }));
}
