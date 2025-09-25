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

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';

import { MetricApiService } from '~/domains/metric/metric.api.service';
import {
  getChartOptions,
  shade,
} from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.helper';

const colors = tailwindConfig.theme.colors;

const registrationsPerStatusColors = {
  [RegistrationStatusEnum.included]: colors.green[shade],
  [RegistrationStatusEnum.new]: colors.blue[shade],
  [RegistrationStatusEnum.validated]: colors.yellow[shade],
  [RegistrationStatusEnum.declined]: colors.red[shade],
  [RegistrationStatusEnum.completed]: colors.purple[shade],
  [RegistrationStatusEnum.deleted]: colors.grey[shade],
  [RegistrationStatusEnum.paused]: colors.orange[shade],
};

// this is the order in the registration table buttons
const registrationStatusSortOrder = [
  RegistrationStatusEnum.new,
  RegistrationStatusEnum.validated,
  RegistrationStatusEnum.included,
  RegistrationStatusEnum.completed,
  RegistrationStatusEnum.declined,
  RegistrationStatusEnum.paused,
  RegistrationStatusEnum.deleted,
];

@Component({
  selector: 'app-registrations-per-status-chart',
  imports: [ChartModule],
  templateUrl: './registrations-per-status-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsPerStatusChartComponent {
  private metricApiService = inject(MetricApiService);

  readonly projectId = input.required<string>();
  readonly getLabelFunction =
    input.required<
      (opts: { title: string; labels: string[]; data: number[] }) => string
    >();

  title = $localize`Registrations per status`;

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
    const labels = registrationStatusSortOrder.filter((status) =>
      Object.keys(queryData).includes(status),
    );
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
    title: this.title,
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

  readonly registrationsPerStatusAriaLabel = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      labels: this.registrationsPerStatusLabelsAndData().labels,
      data: this.registrationsPerStatusChartData().datasets[0].data as number[],
    }),
  );
}
