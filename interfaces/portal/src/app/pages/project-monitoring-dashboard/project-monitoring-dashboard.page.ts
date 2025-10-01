import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

import tailwindConfig from '~/../../tailwind.config';
import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import { AmountSentPerMonthChartComponent } from '~/pages/project-monitoring-dashboard/components/amount-sent-per-month-chart/amount-sent-per-month-chart.component';
import { PaymentsAggregateChartComponent } from '~/pages/project-monitoring-dashboard/components/payments-aggregate-chart/payments-aggregate-chart.component';
import { RegistrationsByCreationDateChartComponent } from '~/pages/project-monitoring-dashboard/components/registrations-by-creation-date-chart/registrations-by-creation-date-chart.component';
import { RegistrationsPerDuplicateStatusComponentChart } from '~/pages/project-monitoring-dashboard/components/registrations-per-duplicate-status-chart/registrations-per-duplicate-status-chart.component';
import { RegistrationsPerStatusChartComponent } from '~/pages/project-monitoring-dashboard/components/registrations-per-status-chart/registrations-per-status-chart.component';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-project-monitoring-dashboard',
  templateUrl: './project-monitoring-dashboard.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageLayoutMonitoringComponent,
    ChartModule,
    CardModule,
    RegistrationsPerStatusChartComponent,
    RegistrationsPerDuplicateStatusComponentChart,
    RegistrationsByCreationDateChartComponent,
    PaymentsAggregateChartComponent,
    AmountSentPerMonthChartComponent,
  ],
})
export class ProjectMonitoringDashboardPageComponent {
  private translatableStringService = inject(TranslatableStringService);

  readonly projectId = input.required<string>();

  getTranslatedAriaLabel = ({
    title,
    labels,
    data,
  }: {
    title: string;
    labels: string[];
    data: number[];
  }) =>
    // The e2e tests cannot access the canvas content of the charts, so we
    // generate an aria-label with enough data to verify that the chart contains
    // the expected data. We also provide some data accessibly like this, but
    // that's limited.
    `${title}. ` +
    this.translatableStringService.commaSeparatedList(
      labels.map((label, index) => `${label}: ${String(data[index])}`),
    );

  getChartOptions = ({
    title,
    showLegend,
    showDataLabels,
  }: {
    title: string;
    showLegend: boolean;
    showDataLabels?: boolean;
  }) => ({
    animation: {
      duration: 0,
    },
    responsive: true,
    scales: {
      y: {
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: title,
        padding: {
          bottom: 40,
        },
      },
      tooltip: {
        backgroundColor: tailwindConfig.theme.colors.black.DEFAULT,
      },
      datalabels: {
        display: showDataLabels,
        align: 'end',
        anchor: 'end',
        font: { weight: 'bold' },
      },
      legend: {
        display: showLegend,
        position: 'bottom',
        align: 'center',
        labels: {
          usePointStyle: true,
        },
      },
    },
  });
}
