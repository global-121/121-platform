import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { SelectButtonModule } from 'primeng/selectbutton';

import { PageLayoutRegistrationComponent } from '~/components/page-layout-registration/page-layout-registration.component';
import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import {
  ACTIVITY_LOG_ITEM_TYPE_ICONS,
  ACTIVITY_LOG_ITEM_TYPE_LABELS,
} from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { ActivityLogExpandedRowComponent } from '~/pages/project-registration-activity-log/components/activity-log-expanded-row/activity-log-expanded-row.component';
import { TableCellOverviewComponent } from '~/pages/project-registration-activity-log/components/table-cell-overview/table-cell-overview.component';
import { getUniqueUserOptions } from '~/utils/unique-users';

export interface ActivityLogTableCellContext {
  projectId: Signal<string>;
  registrationId: Signal<string>;
  currencyCode: Signal<string | undefined>;
  referenceId?: string;
}

@Component({
  selector: 'app-project-registration-activity-log',
  imports: [
    FormsModule,
    SelectButtonModule,
    QueryTableComponent,
    PageLayoutRegistrationComponent,
  ],
  templateUrl: './project-registration-activity-log.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectRegistrationActivityLogPageComponent {
  // this is injected by the router
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  registrationApiService = inject(RegistrationApiService);
  projectApiService = inject(ProjectApiService);

  expandableRowTemplate = ActivityLogExpandedRowComponent;
  readonly tableCellContext = computed<ActivityLogTableCellContext>(() => ({
    projectId: this.projectId,
    registrationId: this.registrationId,
    referenceId: this.registration.data()?.referenceId,
    currencyCode: this.currencyCode,
  }));

  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  activityLog = injectQuery(
    this.registrationApiService.getActivityLog(
      this.projectId,
      this.registrationId,
    ),
  );

  project = injectQuery(this.projectApiService.getProject(this.projectId));

  readonly activities = computed(() => this.activityLog.data()?.data ?? []);

  readonly availableActivityTypes = computed(
    // we use `meta.availableTypes` instead of just mapping the values of the enum
    // because the available types depend on the user's permissions
    () => this.activityLog.data()?.meta.availableTypes ?? [],
  );

  readonly columns = computed<QueryTableColumn<Activity>[]>(() => [
    {
      field: 'type',
      header: $localize`Activity`,
      type: QueryTableColumnType.MULTISELECT,
      options: this.availableActivityTypes().map((type) => ({
        label: ACTIVITY_LOG_ITEM_TYPE_LABELS[type],
        value: type,
        icon: ACTIVITY_LOG_ITEM_TYPE_ICONS[type],
        count: this.activityLog.data()?.meta.count[type] ?? 0,
      })),
    },
    {
      header: $localize`Overview`,
      field: 'COMPUTED_FIELD',
      component: TableCellOverviewComponent,
    },
    {
      field: 'user.username',
      header: $localize`Done by`,
      type: QueryTableColumnType.MULTISELECT,
      options: getUniqueUserOptions(this.activities()),
      displayAsChip: true,
    },
    {
      field: 'created',
      header: $localize`Date and time`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  readonly currencyCode = computed(() => this.project.data()?.currency);
}
