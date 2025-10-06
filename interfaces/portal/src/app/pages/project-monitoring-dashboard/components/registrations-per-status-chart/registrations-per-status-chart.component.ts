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
import { ProjectRegistrationsCountByStatus } from '~/domains/metric/metric.model';
import { REGISTRATION_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { ChartTextAlternativeOptions } from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.page';

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
    input.required<(opts: ChartTextAlternativeOptions) => string>();

  readonly getChartOptions =
    input.required<
      (opts: {
        title: string;
        showLegend: boolean;
        showDataLabels?: boolean;
      }) => unknown
    >();

  title = $localize`Registrations per status`;

  query = injectQuery(() => ({
    ...this.metricApiService.getRegistrationCountByStatus({
      projectId: this.projectId,
    })(),
    enabled: !!this.projectId(),
  }));

  readonly queryData = computed(() =>
    this.query.isSuccess()
      ? this.query.data()
      : ({} as ProjectRegistrationsCountByStatus),
  );

  readonly labels = computed<RegistrationStatusEnum[]>(() => {
    // This is the order in the registration table buttons.
    // The order used in the UI is only encoded in the HTML.
    const registrationStatusSortOrder = [
      RegistrationStatusEnum.new,
      RegistrationStatusEnum.validated,
      RegistrationStatusEnum.included,
      RegistrationStatusEnum.completed,
      RegistrationStatusEnum.declined,
      RegistrationStatusEnum.paused,
      RegistrationStatusEnum.deleted,
    ];
    return registrationStatusSortOrder.filter((status) =>
      Object.keys(this.queryData()).includes(status),
    );
  });

  readonly data = computed(() =>
    this.labels().map(
      (registrationStatus) => this.queryData()[registrationStatus],
    ),
  );

  readonly chartColors = computed<string[]>((): string[] => {
    const themeColors = tailwindConfig.theme.colors;
    const colors = {
      [RegistrationStatusEnum.included]: themeColors.green[500],
      [RegistrationStatusEnum.new]: themeColors.blue[500],
      [RegistrationStatusEnum.validated]: themeColors.yellow[500],
      [RegistrationStatusEnum.declined]: themeColors.red[500],
      [RegistrationStatusEnum.completed]: themeColors.purple[500],
      [RegistrationStatusEnum.deleted]: themeColors.grey[500],
      [RegistrationStatusEnum.paused]: themeColors.orange[500],
    };
    return this.labels().map(
      (registrationStatus) => colors[registrationStatus],
    );
  });

  readonly chartOptions = computed(() =>
    this.getChartOptions()({
      title: this.title,
      showLegend: false,
    }),
  );

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labels().map((status) => REGISTRATION_STATUS_LABELS[status]),
    datasets: [
      {
        data: this.data(),
        backgroundColor: this.chartColors(),
      },
    ],
  }));

  readonly chartTextAlternative = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      primaryLabels: this.labels().map(
        (status) => REGISTRATION_STATUS_LABELS[status],
      ),
      datasets: this.chartData().datasets.map((dataset) => ({
        data: dataset.data as number[],
      })),
    }),
  );
}
