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

const colors = tailwindConfig.theme.colors;

const duplicationColors = {
  [DuplicateStatus.unique]: colors.green[500],
  [DuplicateStatus.duplicate]: colors.red[500],
};

@Component({
  selector: 'app-registrations-per-duplicate-status-chart',
  imports: [ChartModule],

  templateUrl: './registrations-per-duplicate-status-chart.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsPerDuplicateStatusComponentChart {
  private registrationApiService = inject(RegistrationApiService);

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

  title = $localize`Registrations per duplicate status`;

  duplicatesQuery = injectQuery(() => ({
    ...this.registrationApiService.getManyByQuery(
      this.projectId,
      signal({ filter: { duplicateStatus: DuplicateStatus.duplicate } }),
    )(),
    enabled: !!this.projectId(),
  }));

  uniquesQuery = injectQuery(() => ({
    ...this.registrationApiService.getManyByQuery(
      this.projectId,
      signal({ filter: { duplicateStatus: DuplicateStatus.unique } }),
    )(),
    enabled: !!this.projectId(),
  }));

  readonly labels = [DuplicateStatus.duplicate, DuplicateStatus.unique];

  readonly data = computed(() => [
    this.duplicatesQuery.data()?.meta.totalItems ?? 0,
    this.uniquesQuery.data()?.meta.totalItems ?? 0,
  ]);

  readonly duplicationChartColors = computed<string[]>(() =>
    this.labels.map((l) => duplicationColors[l]),
  );

  readonly chartOptions = computed(() =>
    this.getChartOptions()({
      title: this.title,
      showLegend: false,
    }),
  );

  readonly duplicationChartData = computed<ChartData>(() => ({
    labels: this.labels,
    datasets: [
      {
        data: this.data(),
        backgroundColor: this.duplicationChartColors(),
      },
    ],
  }));

  readonly ariaLabel = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      labels: this.labels,
      data: this.duplicationChartData().datasets[0].data as number[],
    }),
  );
}
