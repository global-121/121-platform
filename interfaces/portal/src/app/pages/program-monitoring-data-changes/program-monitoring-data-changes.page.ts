import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { PageLayoutMonitoringComponent } from '~/components/page-layout-monitoring/page-layout-monitoring.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
} from '~/components/query-table/query-table.component';
import { Activity } from '~/domains/registration/registration.model';

@Component({
  selector: 'app-program-monitoring-data-changes',
  imports: [QueryTableComponent, PageLayoutMonitoringComponent],
  templateUrl: './program-monitoring-data-changes.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramMonitoringDataChangesPageComponent {
  readonly programId = input.required<string>();

  readonly columns = computed<QueryTableColumn<Activity>[]>(() => [
    {
      field: 'COMPUTED_FIELD',
      header: $localize`Old value`,
    },
    {
      field: 'COMPUTED_FIELD',
      header: $localize`New value`,
    },
    {
      field: 'user.username',
      header: $localize`Changed by`,
      displayAsChip: true,
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);
}
