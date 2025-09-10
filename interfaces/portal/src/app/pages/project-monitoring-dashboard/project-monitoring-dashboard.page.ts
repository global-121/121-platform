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
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { MetricApiService } from '~/domains/metric/metric.api.service';
import { ProjectAggregatePerPaymentValue } from '~/domains/metric/metric.model';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  duplicationColors,
  getChartOptions,
  paymentColors,
  registrationsByDateColor,
  registrationsPerStatusColors,
} from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.helper';

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

  registrationsPerStatus = injectQuery(() => ({
    ...this.metricApiService.getRegistrationCountByStatus({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  readonly registrationsPerStatusLabelsAndData = computed(() => {
    if (!this.registrationsPerStatus.isSuccess()) {
      return { labels: [], data: [] };
    }
    const queryData = this.registrationsPerStatus.data();
    const labels = Object.keys(queryData).sort();
    const data = labels.map((k) => queryData[k]);
    return { labels, data };
  });

  readonly registrationsPerStatusChartColors = computed<string[]>(
    (): string[] => {
      const colors: Record<string, string> = registrationsPerStatusColors;

      return this.registrationsPerStatusLabelsAndData().labels.map(
        (l): string => colors[l],
      );
    },
  );

  registrationsPerStatusChartOptions = getChartOptions({
    title: $localize`Registrations per status`,
    showLegend: false,
  });

  readonly registrationsPerStatusChartData = computed<ChartData>(() => ({
    labels: this.registrationsPerStatusLabelsAndData().labels,
    datasets: [
      {
        data: this.registrationsPerStatusLabelsAndData().data,
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

  readonly duplicationLabels = signal([
    DuplicateStatus.duplicate,
    DuplicateStatus.unique,
  ]);

  readonly duplicationChartColors = computed<string[]>(() =>
    this.duplicationLabels().map((l) => duplicationColors[l]),
  );

  duplicationChartOptions = getChartOptions({
    title: $localize`Registrations per duplicate status`,
    showLegend: false,
  });

  readonly duplicationChartData = computed<ChartData>(() => ({
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

  readonly registrationsByDateLabelsAndData = computed(() => {
    if (!this.registrationCountByDate.isSuccess()) {
      return { labels: [], data: [] };
    }
    const queryData = this.registrationCountByDate.data();
    const labels = Object.keys(queryData).sort();
    const data = labels.map((k) => queryData[k]);
    return { labels, data };
  });

  readonly registrationsByDateAxisLabels = computed<string[]>(() =>
    this.registrationsByDateLabelsAndData().labels.map((l) => {
      const date = new Date(l);

      if (date.getDate() !== 1) {
        return '';
      }

      return date.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
    }),
  );

  registrationsByDateChartOptions = getChartOptions({
    title: $localize`Registrations by creation date`,
    showLegend: false,
  });

  readonly registrationsByDateChartData = computed<ChartData>(() => ({
    labels: this.registrationsByDateLabelsAndData().labels,
    xLabels: this.registrationsByDateAxisLabels(),
    datasets: [
      {
        data: this.registrationsByDateLabelsAndData().data,
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

  readonly aggregatePerPaymentLabelsAndData = computed(() => {
    if (!this.aggregatePerPayment.isSuccess()) {
      return { labels: [], data: [] };
    }
    const queryData: Record<string, ProjectAggregatePerPaymentValue> =
      this.aggregatePerPayment.data();
    const labels = Object.keys(queryData).sort();
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

  amountSentPerMonth = injectQuery(() => ({
    ...this.metricApiService.getAmountSentByMonth({
      projectId: this.projectId,
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
}
