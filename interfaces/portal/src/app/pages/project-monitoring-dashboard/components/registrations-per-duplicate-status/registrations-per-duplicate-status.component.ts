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
import colors from 'tailwindcss/colors';

import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';

import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  getChartOptions,
  shade,
} from '~/pages/project-monitoring-dashboard/project-monitoring-dashboard.helper';

const duplicationColors = {
  [DuplicateStatus.unique]: colors.green[shade],
  [DuplicateStatus.duplicate]: colors.red[shade],
};

@Component({
  selector: 'app-registrations-per-duplicate-status',
  imports: [ChartModule],

  templateUrl: './registrations-per-duplicate-status.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsPerDuplicateStatusComponent {
  private registrationApiService = inject(RegistrationApiService);

  readonly projectId = input.required<string>();
  readonly getLabelFunction =
    input.required<
      (opts: { title: string; labels: string[]; data: number[] }) => string
    >();

  title = $localize`Registrations per duplicate status`;

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

  readonly duplicationAriaLabel = computed(() =>
    this.getLabelFunction()({
      title: this.title,
      labels: this.duplicationLabels(),
      data: this.duplicationChartData().datasets[0].data as number[],
    }),
  );
}
