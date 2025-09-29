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

const colors = tailwindConfig.theme.colors;

const registrationsPerStatusColors = {
  [RegistrationStatusEnum.included]: colors.green[500],
  [RegistrationStatusEnum.new]: colors.blue[500],
  [RegistrationStatusEnum.validated]: colors.yellow[500],
  [RegistrationStatusEnum.declined]: colors.red[500],
  [RegistrationStatusEnum.completed]: colors.purple[500],
  [RegistrationStatusEnum.deleted]: colors.grey[500],
  [RegistrationStatusEnum.paused]: colors.orange[500],
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
    this.query.isSuccess() ? this.query.data() : {},
  );

  readonly labels = computed<string[]>(() =>
    registrationStatusSortOrder.filter((status) =>
      Object.keys(this.queryData()).includes(status),
    ),
  );

  readonly data = computed(() => this.labels().map((k) => this.queryData()[k]));

  readonly chartColors = computed<string[]>((): string[] => {
    const colors: Record<string, string> = registrationsPerStatusColors;
    return this.labels().map((l): string => colors[l]);
  });

  readonly chartOptions = computed(() =>
    this.getChartOptions()({
      title: this.title,
      showLegend: false,
    }),
  );

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.data(),
        backgroundColor: this.chartColors(),
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
