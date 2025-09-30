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
import colors from 'tailwindcss/colors';

import { MetricApiService } from '~/domains/metric/metric.api.service';

@Component({
  selector: 'app-registrations-by-creation-date-chart',
  imports: [ChartModule],

  templateUrl: './registrations-by-creation-date-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsByCreationDateChartComponent {
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

  title = $localize`Registrations by creation date (last 2 weeks)`;

  query = injectQuery(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    const twoWeeksAgo = date.toISOString().split('T')[0];

    return {
      ...this.metricApiService.getRegistrationCountByDate({
        projectId: this.projectId,
        startDate: twoWeeksAgo,
      })(),
      enabled: !!this.projectId(),
    };
  });

  readonly queryData = computed(() =>
    this.query.isSuccess() ? this.query.data() : {},
  );

  readonly labels = computed<string[]>(() =>
    Object.keys(this.queryData()).sort(),
  );

  readonly data = computed(() => this.labels().map((k) => this.queryData()[k]));

  readonly chartOptions = computed(() =>
    this.getChartOptions()({
      title: this.title,
      showLegend: false,
      showDataLabels: false,
    }),
  );

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labels(),
    datasets: [
      {
        data: this.data(),
        backgroundColor: colors.blue[500],
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
