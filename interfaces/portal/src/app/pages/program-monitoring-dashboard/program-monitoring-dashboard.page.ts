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
import { AmountSentPerMonthChartComponent } from '~/pages/program-monitoring-dashboard/components/amount-sent-per-month-chart/amount-sent-per-month-chart.component';
import { PaymentsAggregateChartComponent } from '~/pages/program-monitoring-dashboard/components/payments-aggregate-chart/payments-aggregate-chart.component';
import { RegistrationsByCreationDateChartComponent } from '~/pages/program-monitoring-dashboard/components/registrations-by-creation-date-chart/registrations-by-creation-date-chart.component';
import { RegistrationsPerDuplicateStatusComponentChart } from '~/pages/program-monitoring-dashboard/components/registrations-per-duplicate-status-chart/registrations-per-duplicate-status-chart.component';
import { RegistrationsPerStatusChartComponent } from '~/pages/program-monitoring-dashboard/components/registrations-per-status-chart/registrations-per-status-chart.component';
import { TranslatableStringService } from '~/services/translatable-string.service';

interface ChartDataSet {
  label?: string;
  data: number[];
}
export interface ChartTextAlternativeOptions {
  title: string;
  primaryLabels: string[];
  datasets: ChartDataSet[];
}

@Component({
  selector: 'app-program-monitoring-dashboard',
  templateUrl: './program-monitoring-dashboard.page.html',
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
export class ProgramMonitoringDashboardPageComponent {
  private translatableStringService = inject(TranslatableStringService);

  readonly programId = input.required<string>();

  getChartTextAlternative = ({
    title,
    primaryLabels,
    datasets,
  }: ChartTextAlternativeOptions) =>
    // The E2E-tests cannot access the canvas-element of the charts, so we
    // generate an aria-label with enough data to verify that the chart contains
    // the expected data. We also provide some data accessibly like this, but
    // that's limited.
    `${title}\n\n${primaryLabels
      .map(
        (axisUnit, labelIndex) =>
          `${axisUnit}: ` +
          this.translatableStringService.commaSeparatedList(
            datasets.map(
              (set: ChartDataSet) =>
                `${set.label ? `${set.label}: ` : ''}${String(set.data[labelIndex])}`,
            ),
          ),
      )
      .join('\n')}`;

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
