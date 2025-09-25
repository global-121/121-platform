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
import {
  getChartOptions,
  shade,
} from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.helper';

@Component({
  selector: 'app-registrations-by-creation-date',
  imports: [ChartModule],

  templateUrl: './registrations-by-creation-date.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsByCreationDateComponent {
  private metricApiService = inject(MetricApiService);
  readonly projectId = input.required<string>();

  readonly getLabelFunction =
    input.required<
      (opts: { title: string; labels: string[]; data: number[] }) => string
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

  readonly labelsAndData = computed(() => {
    if (!this.query.isSuccess()) {
      return { labels: [], data: [] };
    }
    const queryData = this.query.data();
    const labels = Object.keys(queryData).sort();
    const data = labels.map((k) => queryData[k]);
    return { labels, data };
  });

  chartOptions = getChartOptions({
    title: this.title,
    showLegend: false,
    showDataLabels: false,
  });

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labelsAndData().labels,
    datasets: [
      {
        data: this.labelsAndData().data,
        backgroundColor: colors.blue[shade],
      },
    ],
  }));

  readonly ariaLabel = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      labels: this.labelsAndData().labels,
      data: this.chartData().datasets[0].data as number[],
    }),
  );
}
