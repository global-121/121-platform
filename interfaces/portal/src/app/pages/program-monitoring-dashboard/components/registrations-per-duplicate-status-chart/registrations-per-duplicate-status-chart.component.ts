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
import { ChartModule } from 'primeng/chart';

import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';

import tailwindConfig from '~/../../tailwind.config';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { DUPLICATE_STATUS_LABELS } from '~/domains/registration/registration.helper';
import { ChartTextAlternativeOptions } from '~/pages/program-monitoring-dashboard/program-monitoring-dashboard.page';

@Component({
  selector: 'app-registrations-per-duplicate-status-chart',
  imports: [ChartModule],

  templateUrl: './registrations-per-duplicate-status-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsPerDuplicateStatusComponentChart {
  private registrationApiService = inject(RegistrationApiService);

  readonly programId = input.required<string>();

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

  title = $localize`Registrations per duplicate status`;

  duplicatesQuery = injectQuery(() => ({
    ...this.registrationApiService.getManyByQuery(
      this.programId,
      signal({ filter: { duplicateStatus: DuplicateStatus.duplicate } }),
    )(),
    enabled: !!this.programId(),
  }));

  uniquesQuery = injectQuery(() => ({
    ...this.registrationApiService.getManyByQuery(
      this.programId,
      signal({ filter: { duplicateStatus: DuplicateStatus.unique } }),
    )(),
    enabled: !!this.programId(),
  }));

  readonly labels = [
    // Order of the labels in this `labels`-array needs to match the order in the `data`-array
    DUPLICATE_STATUS_LABELS[DuplicateStatus.duplicate],
    DUPLICATE_STATUS_LABELS[DuplicateStatus.unique],
  ];

  readonly data = computed(() => [
    // Order of the labels in `data`-array needs to match the order in the `labels`-array
    this.duplicatesQuery.data()?.meta.totalItems ?? 0,
    this.uniquesQuery.data()?.meta.totalItems ?? 0,
  ]);

  // Labels are also hardcoded.
  readonly chartColors = [
    tailwindConfig.theme.colors.red[500], // duplicate
    tailwindConfig.theme.colors.green[500], // unique
  ];

  readonly chartOptions = computed(() =>
    this.getChartOptions()({
      title: this.title,
      showLegend: false,
    }),
  );

  readonly chartData = computed<ChartData>(() => ({
    labels: this.labels,
    datasets: [
      {
        data: this.data(),
        backgroundColor: this.chartColors,
      },
    ],
  }));

  readonly chartTextAlternative = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      primaryLabels: this.labels,
      datasets: this.chartData().datasets.map((dataset) => ({
        data: dataset.data as number[],
      })),
    }),
  );
}
