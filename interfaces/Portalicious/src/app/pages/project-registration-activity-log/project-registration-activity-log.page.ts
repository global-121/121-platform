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
import { uniqBy } from 'lodash';
import { SelectButtonModule } from 'primeng/selectbutton';

import {
  QueryTableColumn,
  QueryTableColumnType,
  QueryTableComponent,
} from '~/components/query-table/query-table.component';
import { RegistrationPageLayoutComponent } from '~/components/registration-page-layout/registration-page-layout.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { ACTIVITY_LOG_ITEM_TYPE_LABELS } from '~/domains/registration/registration.helper';
import { Activity } from '~/domains/registration/registration.model';
import { ActivityLogExpandedRowComponent } from '~/pages/project-registration-activity-log/components/activity-log-expanded-row/activity-log-expanded-row.component';
import { TableCellActivityComponent } from '~/pages/project-registration-activity-log/components/table-cell-activity.component';
import { TableCellOverviewComponent } from '~/pages/project-registration-activity-log/components/table-cell-overview.component';

export interface ActivityLogTableCellContext {
  projectId: Signal<string>;
  referenceId?: string;
}

@Component({
  selector: 'app-project-registration-activity-log',
  standalone: true,
  imports: [
    FormsModule,
    SelectButtonModule,
    QueryTableComponent,
    RegistrationPageLayoutComponent,
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

  expandableRowTemplate = ActivityLogExpandedRowComponent;
  tableCellContext = computed<ActivityLogTableCellContext>(() => ({
    projectId: this.projectId,
    referenceId: this.registration.data()?.referenceId,
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

  activities = computed(() => this.activityLog.data()?.data ?? []);

  uniqueAuthors = computed(() => {
    return uniqBy(
      this.activities().map(({ user }) => ({
        label: user.username ?? $localize`Unknown user`,
        value: user.username ?? $localize`Unknown user`,
      })),
      'value',
    ).sort((a, b) => a.label.localeCompare(b.label));
  });

  availableActivityTypes = computed(
    () => this.activityLog.data()?.meta.availableTypes ?? [],
  );

  columns = computed<QueryTableColumn<Activity>[]>(() => [
    {
      field: 'type',
      header: $localize`Activity`,
      component: TableCellActivityComponent,
      type: QueryTableColumnType.MULTISELECT,
      options: this.availableActivityTypes().map((type) => {
        const count = this.activityLog.data()?.meta.count[type] ?? 0;
        return {
          label: ACTIVITY_LOG_ITEM_TYPE_LABELS[type] + ` (${String(count)})`,
          value: type,
        };
      }),
    },
    {
      header: $localize`Overview`,
      component: TableCellOverviewComponent,
    },
    {
      // TODO: AB#30792 TField should also support "leaves" such as "user.name" or "user.address.city"
      // @ts-expect-error the typing of query-table does not support "leaves" but the functionality does
      field: 'user.username',
      header: $localize`Done by`,
      type: QueryTableColumnType.MULTISELECT,
      options: this.uniqueAuthors(),
    },
    {
      field: 'created',
      header: $localize`Time and date`,
      type: QueryTableColumnType.DATE,
    },
  ]);

  globalFilterFields = computed<(keyof Activity)[]>(() => [
    'type',
    // TODO: AB#30792 TField should also support "leaves" such as "user.name" or "user.address.city"
    // @ts-expect-error the typing of query-table does not support "leaves" but the functionality does
    'user.username',
    'created',
  ]);
}
